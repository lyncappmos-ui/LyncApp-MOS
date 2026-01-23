
import { CoreState, CoreResponse, CoreError, TripStatus } from '@/types';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { bus } from '@/services/eventBus';
import { MOCK_DB } from '@/services/db';
import { MOSService } from '@/services/mosService';

class CoreRuntime {
  private state: CoreState = CoreState.BOOTING;
  private version = '3.1.0-kernel';
  private lastHealthyAt: string = new Date().toISOString();
  
  private failureCount = 0;
  private maxFailures = 3;
  private isCircuitBroken = false;
  private resetTimeout: any | null = null;

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
      this.reportFailure();
      return this.envelope(fallbackData, {
        code: err.code || 'RUNTIME_FAULT',
        message: err.message || 'Operational runtime error.'
      });
    }
  }

  public async createBranch(data: any) {
    return await MOSService.addBranch({
      id: `b${MOCK_DB.branches.length + 1}`,
      saccoId: 's1',
      name: data.name,
      location: data.location || 'Unknown'
    });
  }

  public async createVehicle(data: any) {
    return await MOSService.addVehicle({
      id: `v${MOCK_DB.vehicles.length + 1}`,
      plate: data.plateNumber || data.plate,
      saccoId: 's1',
      branchId: data.branchId || 'b1',
      capacity: data.capacity || 14,
      type: data.type || 'Matatu'
    });
  }

  public async createOperator(data: any) {
    return await MOSService.addCrew({
      id: `c${MOCK_DB.crews.length + 1}`,
      name: data.name,
      role: data.role || 'DRIVER',
      phone: data.phone || '254000000000',
      trustScore: 100,
      incentiveBalance: 0
    });
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
