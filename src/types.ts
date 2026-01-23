
/**
 * LyncApp MOS Core - Resilient Type Definitions
 */

export enum CoreState {
  BOOTING = 'BOOTING',
  WARMING = 'WARMING',
  READY = 'READY',
  DEGRADED = 'DEGRADED',
  READ_ONLY = 'READ_ONLY',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN'
}

export interface CoreError {
  code: string;
  message: string;
}

/**
 * CoreResponse envelope refactored to ensure the data property 
 * is always present, avoiding "undefined" runtime crashes.
 */
export interface CoreResponse<T> {
  coreState: CoreState;
  data: T; 
  error?: CoreError;
  version: string;
  timestamp: string;
}

export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  READY = 'READY',
  ACTIVE = 'ACTIVE',
  DELAYED = 'DELAYED',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum SmsStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED'
}

export type ConsumerType = 'sacco_admin' | 'operator_terminal' | 'platform_control' | 'platform_growth';

export type MOSCapability = 
  | 'system_health' | 'operational_metrics' | 'trust_metrics' 
  | 'revenue_integrity' | 'audit_logs' | 'growth_metrics' 
  | 'acquisition_metrics' | 'projections';

export interface PlatformOperationalMetrics {
  activeTripCount: number;
  globalTicketVolume: number;
  systemLoadFactor: number;
  lastAnchorTimestamp: string;
}

export interface PlatformGrowthMetrics {
  gmvTrend: { date: string; total: number }[];
  operatorChurnRate: number;
  newVehicleAcquisition: number;
  projectionConfidence: number;
}

export interface RevenueIntegrityReport {
  unanchoredRevenue: number;
  reconciliationRate: number;
  web3VerificationStatus: 'OPTIMAL' | 'PENDING' | 'CRITICAL';
}

export interface SACCO { id: string; name: string; code: string; }
export interface Branch { id: string; saccoId: string; name: string; location: string; }
export interface Vehicle { id: string; plate: string; saccoId: string; branchId: string; capacity: number; type: string; lastLocation?: string; }
export interface CrewMember { id: string; name: string; role: 'DRIVER' | 'CONDUCTOR'; phone: string; trustScore: number; incentiveBalance: number; }
export interface Route { id: string; name: string; code: string; origin: string; destination: string; baseFare: number; segments: string[]; }
export interface Trip { id: string; routeId: string; vehicleId: string; driverId: string; conductorId: string; branchId: string; status: TripStatus; scheduledTime: string; actualStartTime?: string; actualEndTime?: string; totalRevenue: number; ticketCount: number; }
export interface Ticket { id: string; tripId: string; passengerPhone: string; amount: number; timestamp: string; synced: boolean; }
export interface SmsLog { id: string; phoneNumber: string; message: string; status: SmsStatus; retryCount: number; timestamp: string; }
export interface DailyAnchor { id: string; date: string; saccoId: string; revenueHash: string; txId?: string; verified: boolean; operationCount: number; }
export interface IncentiveTransaction { id: string; operatorId: string; amount: number; reason: string; timestamp: string; }
export interface VerifiableCredential { issuer: string; subject: string; claims: Record<string, any>; signature: string; proofType: string; }
