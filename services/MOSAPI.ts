
import { CrewMember, Trip, Route, Vehicle, CoreResponse, TripStatus, CoreState } from '../types';
import { MOCK_DB } from './db';
import { runtime } from '../core/coreRuntime';
import { AuthService } from './authService';
import { MetricsService } from './metricsService';
import { MOSCore } from '../core/MOSCore';
import { bus, MOSEvents } from './eventBus';

/**
 * Fallback object for when no real data is available.
 * Ensures Type Safety across the Platform.
 */
export const fallbackState: {
  operator: CrewMember;
  activeTrip: Trip | null;
  route: Route | null;
  vehicle: Vehicle | null;
} = {
  operator: { id: 'unknown', name: 'Unknown Operator', role: 'N/A' },
  activeTrip: null,
  route: null,
  vehicle: null,
};

/**
 * LyncApp MOS High-Integrity Gateway
 */
export const LyncMOS = {
  
  /**
   * Safe State Aggregator
   */
  async getState(phone: string = "254700000004"): Promise<CoreResponse<typeof fallbackState>> {
    return runtime.executeSafe(async () => {
      const crew = MOCK_DB.crews.find(c => c.phone === phone);
      if (!crew) throw new Error("UNAUTHORIZED_OPERATOR");
      
      const activeTrip = MOCK_DB.trips.find(t => t.conductorId === crew.id && t.status === TripStatus.ACTIVE);
      const route = activeTrip ? MOCK_DB.routes.find(r => r.id === activeTrip.routeId) : null;
      const vehicle = activeTrip ? MOCK_DB.vehicles.find(v => v.id === activeTrip.vehicleId) : null;

      return {
        operator: crew ?? fallbackState.operator,
        activeTrip: activeTrip ?? fallbackState.activeTrip,
        route: route ?? fallbackState.route,
        vehicle: vehicle ?? fallbackState.vehicle,
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
 * RPC Gateway Relay for cross-frame platform communication
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
