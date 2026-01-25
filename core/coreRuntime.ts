
import { CoreState, CoreResponse, CoreError } from '@/types';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { bus } from '@/services/eventBus';

class CoreRuntime {
  private state: CoreState = CoreState.BOOTING;
  private version = '3.8.0-stable';
  private lastHealthyAt: string = new Date().toISOString();
  
  private failureCount = 0;
  private maxFailures = 3;
  private isCircuitBroken = false;
  private resetTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window === 'undefined') {
      this.initialize();
    }
  }

  private async initialize() {
    this.state = CoreState.WARMING;
    try {
      await this.checkDependencies();
      this.state = CoreState.READY;
    } catch (e) {
      this.state = CoreState.DEGRADED;
      console.warn("[MOS_CORE] Runtime entered DEGRADED state.");
    }
  }

  public getState(): CoreState {
    return this.isCircuitBroken ? CoreState.CIRCUIT_OPEN : this.state;
  }

  public async checkDependencies(): Promise<Record<string, boolean>> {
    const health = {
      db: false,
      bus: !!bus
    };

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('saccos').select('count', { count: 'exact', head: true });
        health.db = !error;
      } else {
        health.db = true; 
      }
    } catch (e) {
      health.db = false;
    }

    if (Object.values(health).every(v => v)) {
      this.lastHealthyAt = new Date().toISOString();
      if (this.state === CoreState.DEGRADED || this.state === CoreState.WARMING) {
        this.state = CoreState.READY;
      }
      this.resetCircuit(); 
    } else {
      this.reportFailure();
    }

    return health;
  }

  public async executeSafe<T>(
    operation: () => Promise<T>,
    fallbackData: T,
    options: { isWrite?: boolean } = {}
  ): Promise<CoreResponse<T>> {
    
    if (this.isCircuitBroken) {
      return this.envelope(fallbackData, {
        code: 'CIRCUIT_OPEN',
        message: 'Platform in protection mode. Using local fallback.'
      });
    }

    if (options.isWrite && (this.state === CoreState.READ_ONLY || this.state === CoreState.DEGRADED)) {
      return this.envelope(fallbackData, {
        code: 'WRITE_PROTECTION_FAULT',
        message: `System in ${this.state} state. Writes inhibited.`
      });
    }

    try {
      const result = await operation();
      // Ensure data is never null by falling back to fallbackData
      const safeResult = result ?? fallbackData;
      this.onSuccess();
      return this.envelope(safeResult);
    } catch (err: unknown) {
      this.reportFailure();
      const message = err instanceof Error ? err.message : 'Operational runtime error.';
      return this.envelope(fallbackData, {
        code: 'RUNTIME_FAULT',
        message
      });
    }
  }

  public envelope<T>(data: T, error?: CoreError): CoreResponse<T> {
    return {
      coreState: this.getState(),
      data,
      error,
      version: this.version,
      timestamp: new Date().toISOString()
    };
  }

  private onSuccess() {
    this.failureCount = 0;
  }

  private reportFailure() {
    this.failureCount++;
    if (this.failureCount >= this.maxFailures) {
      this.tripCircuit();
    }
  }

  private tripCircuit() {
    this.isCircuitBroken = true;
    if (this.resetTimeout) clearTimeout(this.resetTimeout);
    this.resetTimeout = setTimeout(() => {
      this.resetCircuit();
    }, 30000); 
  }

  public resetCircuit() {
    this.isCircuitBroken = false;
    this.failureCount = 0;
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
  }

  public getUptime(): number {
    return typeof process !== 'undefined' && typeof (process as any).uptime === 'function' ? (process as any).uptime() : 0;
  }
}

export const runtime = new CoreRuntime();
