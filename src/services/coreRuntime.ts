
import { CoreState, CoreResponse, CoreError } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { bus } from './eventBus';

class CoreRuntime {
  private state: CoreState = CoreState.BOOTING;
  private version = '1.0.1-resilient';
  private lastHealthyAt: string = new Date().toISOString();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    this.state = CoreState.WARMING;
    try {
      await this.checkDependencies();
      this.state = CoreState.READY;
    } catch (e) {
      this.state = CoreState.DEGRADED;
    }
  }

  public getState(): CoreState {
    return this.state;
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
        health.db = true; // Local dev mode fallback
      }
    } catch (e) {
      health.db = false;
    }

    if (Object.values(health).every(v => v)) {
      this.lastHealthyAt = new Date().toISOString();
      if (this.state === CoreState.DEGRADED) this.state = CoreState.READY;
    } else {
      this.state = CoreState.DEGRADED;
    }

    return health;
  }

  public async executeSafe<T>(
    operation: () => Promise<T>,
    options: { isWrite?: boolean } = {}
  ): Promise<CoreResponse<T>> {
    // Write Guard
    if (options.isWrite && (this.state === CoreState.READ_ONLY || this.state === CoreState.DEGRADED)) {
      return this.envelope(null, {
        code: 'CORE_PROTECTION_FAULT',
        message: `Writes disabled. System is currently in ${this.state} state.`
      });
    }

    try {
      const result = await operation();
      return this.envelope(result);
    } catch (err: any) {
      console.error(`[MOS_RUNTIME_CRITICAL] ${err.message}`);
      
      // Automatic Failure Isolation
      if (err.message.includes('fetch') || err.message.includes('Supabase') || err.message.includes('401')) {
        this.state = CoreState.DEGRADED;
      }

      return this.envelope(null, {
        code: err.code || 'RUNTIME_EXCEPTION',
        message: err.message || 'An unexpected MOS Core error occurred.'
      });
    }
  }

  public envelope<T>(data: T | null, error?: CoreError): CoreResponse<T> {
    return {
      coreState: this.state,
      data,
      error,
      version: this.version,
      timestamp: new Date().toISOString()
    };
  }

  public getUptime(): number {
    // Cast process to any to access Node.js specific uptime() which might be missing in environment types
    if (typeof process !== 'undefined' && typeof (process as any).uptime === 'function') {
      return (process as any).uptime();
    }
    return 0; // Fallback for pure browser environments
  }

  public getLastHealthyAt(): string {
    return this.lastHealthyAt;
  }
}

export const runtime = new CoreRuntime();
