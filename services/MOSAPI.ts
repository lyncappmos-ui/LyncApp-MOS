
import { MOSCore } from '../core/MOSCore';
import { MOCK_DB } from './db';
import { TripStatus, ConsumerType, MOSCapability } from '../types';
import { MetricsService } from './metricsService';
import { bus, MOSEvents } from './eventBus';
import { AuthService } from './authService';

/**
 * LyncApp MOS Production RPC Gateway (V4)
 * The secure entry point for all internal LyncApp platforms.
 */
export const LyncMOS = {
  
  // --- PLATFORM READ MODELS (Anonymized & Aggregated) ---

  async getPlatformMetrics(key: string) {
    AuthService.authorize(key, 'operational_metrics');
    return MetricsService.getPlatformOperations();
  },

  async getGrowthData(key: string) {
    AuthService.authorize(key, 'growth_metrics');
    return MetricsService.getGrowthMetrics();
  },

  async getRevenueHealth(key: string) {
    AuthService.authorize(key, 'revenue_integrity');
    return MetricsService.getRevenueIntegrity();
  },

  // --- FLEET OPERATIONS ---

  async dispatch(key: string, tripId: string) {
    AuthService.authorize(key, 'operational_metrics'); 
    return await MOSCore.dispatchTrip(tripId);
  },

  // --- TERMINAL EDGES (Device Identity Based) ---

  async getTerminalContext(phone: string) {
    const crew = MOCK_DB.crews.find(c => c.phone === phone);
    if (!crew) throw new Error("E401: UNAUTHORIZED_OPERATOR");
    
    const activeTrip = MOCK_DB.trips.find(t => t.conductorId === crew.id && t.status === TripStatus.ACTIVE);
    const route = activeTrip ? MOCK_DB.routes.find(r => r.id === activeTrip.routeId) : null;
    const vehicle = activeTrip ? MOCK_DB.vehicles.find(v => v.id === activeTrip.vehicleId) : null;

    return { operator: crew, activeTrip, route, vehicle };
  },

  async ticket(tripId: string, phone: string, amount: number) {
    // Validated at domain level in MOSCore
    return await MOSCore.issueTicket({ tripId, phone, amount });
  }
};

/**
 * PRODUCTION GATEWAY RELAY
 */
if (typeof window !== 'undefined') {
  const WHITELISTED_ORIGINS = [
    window.location.origin, 
    "https://control.lync.app", 
    "https://growth.lync.app"
  ];

  window.addEventListener('message', async (event) => {
    // 1. Origin Guard
    if (!WHITELISTED_ORIGINS.includes(event.origin)) {
      console.warn(`[MOS_SECURITY] Blocked cross-origin request from: ${event.origin}`);
      return; 
    }

    const { protocol, method, payload, requestId, platformKey } = event.data;

    // 2. Protocol Check
    if (protocol !== 'LYNC_RPC_V1') return;

    try {
      const api = LyncMOS as any;
      if (typeof api[method] !== 'function') {
         throw new Error(`E404: METHOD_NOT_FOUND - ${method}`);
      }

      // 3. Execution & Authorization Trace
      const startTime = performance.now();
      
      let result;
      // Methods requiring Platform Auth
      const requiresAuth = ['getPlatformMetrics', 'getGrowthData', 'getRevenueHealth', 'dispatch'];
      
      if (requiresAuth.includes(method)) {
         if (!platformKey) throw new Error("E401: MISSING_PLATFORM_KEY");
         result = await api[method](platformKey, ...(payload || []));
      } else {
         result = await api[method](...(payload || []));
      }

      const duration = (performance.now() - startTime).toFixed(2);
      
      // 4. Successful Response Relay
      event.source?.postMessage({
        protocol: 'LYNC_RPC_V1',
        type: 'RESPONSE',
        requestId,
        success: true,
        data: result,
        meta: { duration, timestamp: Date.now() }
      }, { targetOrigin: event.origin });

      // Notify internal Core Hub of the successful connection
      bus.emit(MOSEvents.HEALTH_CHECK, { 
        consumer: platformKey ? AuthService.getConsumerInfo(platformKey)?.label : 'Unknown Edge',
        method,
        status: 'SUCCESS',
        latency: `${duration}ms`
      });

    } catch (err: any) {
      // 5. Secure Error Relay
      event.source?.postMessage({
        protocol: 'LYNC_RPC_V1',
        type: 'RESPONSE',
        requestId,
        success: false,
        error: err.message
      }, { targetOrigin: event.origin });

      bus.emit(MOSEvents.HEALTH_CHECK, { 
        consumer: platformKey ? AuthService.getConsumerInfo(platformKey)?.label : 'Unknown Edge',
        method,
        status: 'DENIED',
        error: err.message
      });
    }
  });

  // PRODUCTION EVENT BROADCAST
  bus.on('*', (data: any, eventName: string) => {
    const packet = { 
      protocol: 'LYNC_RPC_V1',
      type: 'EVENT',
      eventName, 
      data: eventName.includes('TICKET') ? { ...data, passengerPhone: 'REDACTED' } : data 
    };
    
    // Broadcast to all frames/windows
    window.parent.postMessage(packet, '*');
  });
}
