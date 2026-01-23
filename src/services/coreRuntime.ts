
import { CoreState, CoreResponse, CoreError } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { bus } from './eventBus';

/**
 * PHASE 3: Circuit Breaker & Offline Fallback implementation.
 * Manages system health and prevents cascading failures.
 */
class CoreRuntime {
  private state: CoreState = CoreState.BOOTING;
  private version = '1.1.0-resilient';
  private lastHealthyAt: string = new Date().toISOString();
  
  // Circuit Breaker State
  private failureCount = 0;
  private maxFailures = 3;
  private isCircuitBroken = false;
  private resetTimeout: any = null;

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
      console.warn("[MOS_RUNTIME] Warmup failed. Operating in DEGRADED mode.");
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
        health.db = true; // Local dev mode fallback
      }
    } catch (e) {
      health.db = false;
    }

    if (Object.values(health).every(v => v)) {
      this.lastHealthyAt = new Date().toISOString();
      if (this.state === CoreState.DEGRADED) this.state = CoreState.READY;
      this.resetCircuit(); 
    } else {
      this.reportFailure();
    }

    return health;
  }

  /**
   * PHASE 1 & 3: High-integrity execution wrapper with fallback and safe defaults.
   * Ensures the frontend never receives 'undefined' or a broken object.
   */
  public async executeSafe<T>(
    operation: () => Promise<T>,
    fallbackData: T, // Explicitly required fallback
    options: { isWrite?: boolean } = {}
  ): Promise<CoreResponse<T>> {
    
    // Check Circuit Breaker
    if (this.isCircuitBroken) {
      return this.envelope(fallbackData, {
        code: 'CIRCUIT_BREAKER_OPEN',
        message: 'System is currently protecting itself. Using offline fallback data.'
      });
    }

    // Write Guard
    if (options.isWrite && (this.state === CoreState.READ_ONLY || this.state === CoreState.DEGRADED)) {
      return this.envelope(fallbackData, {
        code: 'CORE_PROTECTION_FAULT',
        message: `Writes disabled. System is currently in ${this.state} state.`
      });
    }

    try {
      const result = await operation();
      // Ensure result is not null/undefined if it's supposed to be an array or object
      const safeResult = (result === null || result === undefined) ? fallbackData : result;
      
      this.onSuccess();
      return this.envelope(safeResult);
    } catch (err: any) {
      console.error(`[MOS_RUNTIME_CRITICAL] ${err.message}`);
      this.reportFailure();

      return this.envelope(fallbackData, {
        code: err.code || 'RUNTIME_EXCEPTION',
        message: err.message || 'An unexpected MOS Core error occurred. Using fallback.'
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
    console.warn("[MOS_RUNTIME] CIRCUIT BREAKER TRIPPED! Protecting core services.");
    this.isCircuitBroken = true;
    
    if (this.resetTimeout) clearTimeout(this.resetTimeout);
    this.resetTimeout = setTimeout(() => {
      this.resetCircuit();
    }, 30000); // 30s cooling period
  }

  public resetCircuit() {
    if (this.isCircuitBroken) {
      console.log("[MOS_RUNTIME] Resetting circuit breaker...");
      this.isCircuitBroken = false;
      this.failureCount = 0;
    }
  }

  public getUptime(): number {
    if (typeof process !== 'undefined' && typeof (process as any).uptime === 'function') {
      return (process as any).uptime();
    }
    return 0;
  }

  public getLastHealthyAt(): string {
    return this.lastHealthyAt;
  }
}

export const runtime = new CoreRuntime();
