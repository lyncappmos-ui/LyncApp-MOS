
import { CrewMember, Trip, Route, Vehicle, CoreResponse, TripStatus } from '../types';
import { MOCK_DB } from './db';
import { runtime } from '../core/coreRuntime';
import { AuthService } from './authService';
import { MetricsService } from './metricsService';
import { MOSCore } from '../core/MOSCore';
import { bus, MOSEvents } from './eventBus';

/**
 * Fallback object for high-integrity type safety.
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
    role: 'CONDUCTOR', // Changed to match CrewMember role literal type
    phone: '0',
    trustScore: 0,
    incentiveBalance: 0
  },
  activeTrip: null,
  route: null,
  vehicle: null,
};

export const LyncMOS = {
  
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
    const fallback = MOCK_DB.trips.find(t => t.id === tripId) || MOCK_DB.trips[0];
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'operational_metrics'); 
      return await MOSCore.dispatchTrip(tripId);
    }, fallback, { isWrite: true });
  },

  async getTerminalContext(phone: string): Promise<CoreResponse<typeof fallbackState>> {
    return runtime.executeSafe(async () => {
      const crew = MOCK_DB.crews.find(c => c.phone === phone);
      if (!crew) throw new Error("E401: UNAUTHORIZED_OPERATOR");
      
      const activeTrip = MOCK_DB.trips.find(t => t.conductorId === crew.id && t.status === TripStatus.ACTIVE);
      const route = activeTrip ? MOCK_DB.routes.find(r => r.id === activeTrip.routeId) : null;
      const vehicle = activeTrip ? MOCK_DB.vehicles.find(v => v.id === activeTrip.vehicleId) : null;

      return { operator: crew, activeTrip: activeTrip ?? null, route: route ?? null, vehicle: vehicle ?? null };
    }, fallbackState);
  },

  async ticket(tripId: string, phone: string, amount: number) {
    return runtime.executeSafe(async () => {
      return await MOSCore.issueTicket({ tripId, phone, amount });
    }, {
      id: '',
      tripId,
      passengerPhone: phone,
      amount,
      timestamp: new Date().toISOString(),
      synced: false
    }, { isWrite: true });
  }
};

/**
 * RPC Relay for Platform Integration.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('message', async (event) => {
    const { protocol, method, payload, requestId, platformKey } = event.data;
    if (protocol !== 'LYNC_RPC_V1') return;

    try {
      const api = LyncMOS as any;
      if (typeof api[method] !== 'function') throw new Error(`METHOD_NOT_FOUND: ${method}`);

      const result = await api[method](platformKey || '', ...(payload || []));

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
