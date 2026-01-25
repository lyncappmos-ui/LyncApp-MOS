
import { TerminalContext, Trip, CoreResponse, TripStatus, Ticket, PlatformOperationalMetrics } from '../types';
import { MOCK_DB } from './db';
import { runtime } from '../core/coreRuntime';
import { AuthService } from './authService';
import { MetricsService } from './metricsService';
import { MOSCore } from '../core/MOSCore';
import { bus, MOSEvents } from './eventBus';

/**
 * Type-safe Fallback State for Terminal Context
 */
export const terminalFallback: TerminalContext = {
  operator: null,
  activeTrip: null,
  route: null,
  vehicle: null,
};

export const LyncMOS = {
  
  async getPlatformMetrics(key: string): Promise<CoreResponse<PlatformOperationalMetrics>> {
    const fallback: PlatformOperationalMetrics = {
      activeTripCount: 0,
      globalTicketVolume: 0,
      systemLoadFactor: 0,
      lastAnchorTimestamp: new Date().toISOString()
    };

    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'operational_metrics');
      return MetricsService.getPlatformOperations();
    }, fallback);
  },

  async dispatch(key: string, tripId: string): Promise<CoreResponse<Trip>> {
    const fallback = MOCK_DB.trips.find(t => t.id === tripId) || MOCK_DB.trips[0];
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'operational_metrics'); 
      return await MOSCore.dispatchTrip(tripId);
    }, fallback, { isWrite: true });
  },

  async getTerminalContext(phone: string): Promise<CoreResponse<TerminalContext>> {
    return runtime.executeSafe(async () => {
      const crew = MOCK_DB.crews.find(c => c.phone === phone);
      if (!crew) throw new Error("E401: UNAUTHORIZED_OPERATOR");
      
      const activeTrip = MOCK_DB.trips.find(t => t.conductorId === crew.id && t.status === TripStatus.ACTIVE);
      const route = activeTrip ? MOCK_DB.routes.find(r => r.id === activeTrip.routeId) : null;
      const vehicle = activeTrip ? MOCK_DB.vehicles.find(v => v.id === activeTrip.vehicleId) : null;

      const context: TerminalContext = { 
        operator: crew, 
        activeTrip: activeTrip ?? null, 
        route: route ?? null, 
        vehicle: vehicle ?? null 
      };
      
      return context;
    }, terminalFallback);
  },

  async ticket(tripId: string, phone: string, amount: number): Promise<CoreResponse<Ticket>> {
    const fallback: Ticket = {
      id: '',
      tripId,
      passengerPhone: phone,
      amount,
      timestamp: new Date().toISOString(),
      synced: false
    };

    return runtime.executeSafe(async () => {
      return await MOSCore.issueTicket({ tripId, phone, amount });
    }, fallback, { isWrite: true });
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
      const api = LyncMOS as Record<string, any>;
      if (typeof api[method] !== 'function') throw new Error(`METHOD_NOT_FOUND: ${method}`);

      const response: CoreResponse<any> = await api[method](platformKey || '', ...(payload || []));

      event.source?.postMessage({
        protocol: 'LYNC_RPC_V1',
        type: 'RESPONSE',
        requestId,
        success: !response.error,
        data: response.data,
        error: response.error?.message
      }, { targetOrigin: event.origin });

      bus.emit(MOSEvents.HEALTH_CHECK, { consumer: platformKey || 'Edge', method, status: response.error ? 'ERROR' : 'SUCCESS' });
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
