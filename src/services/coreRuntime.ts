
import { CoreState, CoreResponse, CoreError } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { bus } from './eventBus';

/**
 * LyncApp MOS Core Runtime
 * Responsibility: State Management, Error Isolation, and Health Orchestration.
 */
class CoreRuntime {
  private state: CoreState = CoreState.BOOTING;
  private version = '1.0.0-resilient';
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

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('saccos').select('count', { count: 'exact', head: true });
      health.db = !error;
    } else {
      health.db = true; // In mock mode, DB is always "healthy"
    }

    if (Object.values(health).every(v => v)) {
      this.lastHealthyAt = new Date().toISOString();
      if (this.state === CoreState.DEGRADED) this.state = CoreState.READY;
    } else {
      this.state = CoreState.DEGRADED;
    }

    return health;
  }

  /**
   * Safe Execution Wrapper
   * Wraps all business logic to ensure the Core NEVER crashes.
   */
  public async executeSafe<T>(
    operation: () => Promise<T>,
    options: { isWrite?: boolean } = {}
  ): Promise<CoreResponse<T>> {
    const timestamp = new Date().toISOString();

    // 1. Guard against writes in READ_ONLY or DEGRADED states
    if (options.isWrite && (this.state === CoreState.READ_ONLY || this.state === CoreState.DEGRADED)) {
      return this.envelope(null, {
        code: 'CORE_STATE_RESTRICTION',
        message: `Write operations disabled while core is in ${this.state} state.`
      });
    }

    try {
      const result = await operation();
      return this.envelope(result);
    } catch (err: any) {
      console.error(`[RUNTIME_FAULT] ${err.message}`);
      
      // Auto-degrade if we hit a systemic error
      if (err.message.includes('DB') || err.message.includes('NETWORK')) {
        this.state = CoreState.DEGRADED;
      }

      return this.envelope(null, {
        code: err.code || 'INTERNAL_RUNTIME_ERROR',
        message: err.message
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
    return (process as any).uptime();
  }

  public getLastHealthyAt(): string {
    return this.lastHealthyAt;
  }
}

export const runtime = new CoreRuntime();
