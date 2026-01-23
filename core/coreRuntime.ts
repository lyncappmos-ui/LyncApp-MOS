import { CoreState, CoreResponse, CoreError } from '@/types';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { bus } from '@/services/eventBus';

/**
 * MOS Core Runtime
 * High-Integrity execution with circuit breaking and offline fallbacks.
 * Refactored for Next.js 15 and Node 24 serverless environments.
 */
class CoreRuntime {
  private state: CoreState = CoreState.BOOTING;
  private version = '2.8.0-core';
  private lastHealthyAt: string = new Date().toISOString();
  
  private failureCount = 0;
  private maxFailures = 3;
  private isCircuitBroken = false;
  // Fix: Use any instead of NodeJS.Timeout to avoid namespace errors in environments where NodeJS types are not globally available
  private resetTimeout: any | null = null;

  constructor() {
    // Execution context check: only initialize on server-side entry
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
      console.warn("[MOS_CORE] Runtime initialized in degraded mode.");
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
        health.db = true; // Local dev mode assumes healthy fallback
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

  /**
   * executeSafe: High-integrity execution wrapper for Route Handlers.
   * Ensures every API call returns a valid envelope and respects the circuit breaker.
   */
  public async executeSafe<T>(
    operation: () => Promise<T>,
    fallbackData: T,
    options: { isWrite?: boolean } = {}
  ): Promise<CoreResponse<T>> {
    
    if (this.isCircuitBroken) {
      return this.envelope(fallbackData, {
        code: 'CIRCUIT_OPEN',
        message: 'Platform in protection mode. Using mock failover.'
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
      const safeResult = (result === null || result === undefined) ? fallbackData : result;
      this.onSuccess();
      return this.envelope(safeResult);
    } catch (err: any) {
      console.error(`[MOS_RUNTIME_CRITICAL] ${err.message}`);
      this.reportFailure();

      return this.envelope(fallbackData, {
        code: err.code || 'RUNTIME_FAULT',
        message: err.message || 'Operational runtime error.'
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
    return typeof process !== 'undefined' && (process as any).uptime ? (process as any).uptime() : 0;
  }

  public getLastHealthyAt(): string {
    return this.lastHealthyAt;
  }
}

export const runtime = new CoreRuntime();