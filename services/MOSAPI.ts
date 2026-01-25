
import { CrewMember, Trip, Route, Vehicle, CoreResponse, TripStatus } from '../types';
import { MOCK_DB } from './db';
import { runtime } from '../core/coreRuntime';
import { AuthService } from './authService';
import { MetricsService } from './metricsService';
import { MOSCore } from '../core/MOSCore';
import { bus, MOSEvents } from './eventBus';

/**
 * Fallback object for high-integrity type safety across the Platform.
 * Ensures the platform doesn't crash on null upstream data.
 */
export const fallbackState: {
  operator: CrewMember;
  activeTrip: Trip | null;
  route: Route | null;
  vehicle: Vehicle | null;
} = {
  operator: { 
    id: 'unknown', 
    name: 'Unknown Operator', 
    role: 'N/A',
    phone: '0',
    trustScore: 0,
    incentiveBalance: 0
  },
  activeTrip: null,
  route: null,
  vehicle: null,
};

/**
 * LyncApp MOS High-Integrity Gateway
 */
export const LyncMOS = {
  
  /**
   * Safe State Aggregator for terminal edges.
   */
  async getState(phone: string = "254700000004"): Promise<CoreResponse<typeof fallbackState>> {
    return runtime.executeSafe(async () => {
      const crew = MOCK_DB.crews.find(c => c.phone === phone);
      if (!crew) throw new Error("UNAUTHORIZED_OPERATOR");
      
      const activeTrip = MOCK_DB.trips.find(t => t.conductorId === crew.id && t.status === TripStatus.ACTIVE);
      const route = activeTrip ? MOCK_DB.routes.find(r => r.id === activeTrip.routeId) : null;
      const vehicle = activeTrip ? MOCK_DB.vehicles.find(v => v.id === activeTrip.vehicleId) : null;

      return {
        operator: crew,
        activeTrip: activeTrip ?? null,
        route: route ?? null,
        vehicle: vehicle ?? null,
      };
    }, fallbackState);
  },

  async getPlatformMetrics(key: string) {
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'operational_metrics');
      return MetricsService.getPlatformOperations();
    }, {
      activeTripCount: 0,
      globalTicketVolume: 0,
      systemLoadFactor: 0,
      lastAnchorTimestamp: new Date().toISOString()
    });
  },

  async dispatch(key: string, tripId: string) {
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'operational_metrics'); 
      return await MOSCore.dispatchTrip(tripId);
    }, null as any, { isWrite: true });
  },

  async ticket(tripId: string, phone: string, amount: number) {
    return runtime.executeSafe(async () => {
      return await MOSCore.issueTicket({ tripId, phone, amount });
    }, null as any, { isWrite: true });
  },

  /**
   * Internal Context for Terminal Edges
   */
  async getTerminalContext(phone: string) {
    return this.getState(phone);
  }
};

/**
 * RPC Gateway Relay for cross-frame platform communication.
 * Validates origins and standardizes postMessage protocol.
 */
if (typeof window !== 'undefined') {
  const WHITELISTED_ORIGINS = [window.location.origin];

  window.addEventListener('message', async (event) => {
    if (!WHITELISTED_ORIGINS.includes(event.origin)) return;

    const { protocol, method, payload, requestId, platformKey } = event.data;
    if (protocol !== 'LYNC_RPC_V1') return;

    try {
      const api = LyncMOS as any;
      if (typeof api[method] !== 'function') throw new Error(`METHOD_NOT_FOUND: ${method}`);

      const result = platformKey 
        ? await api[method](platformKey, ...(payload || []))
        : await api[method](...(payload || []));

      event.source?.postMessage({
        protocol: 'LYNC_RPC_V1',
        type: 'RESPONSE',
        requestId,
        success: true,
        data: result
      }, { targetOrigin: event.origin });

      bus.emit(MOSEvents.HEALTH_CHECK, { consumer: platformKey || 'Edge', method, status: 'SUCCESS' });
    } catch (err: any) {
      event.source?.postMessage({
        protocol: 'LYNC_RPC_V1',
        type: 'RESPONSE',
        requestId,
        success: false,
        error: err.message
      }, { targetOrigin: event.origin });
    }
  });
}
