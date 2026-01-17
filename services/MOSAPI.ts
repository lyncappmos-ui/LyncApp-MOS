
import { MOSCore } from '../core/MOSCore';
import { MOCK_DB } from './db';
import { TripStatus } from '../types';
import { MOSService } from './mosService';
import { isSupabaseConfigured } from './supabaseClient';
import { bus, MOSEvents } from './eventBus';

/**
 * LyncApp MOS Public API Contract
 * The exclusive gateway. Terminals (Spokes) must use this instead of direct DB access.
 */
export const LyncMOS = {
  // --- STATE ACCESS (Proxied through Core) ---
  
  async getSyncState() {
    return {
      isOnline: navigator.onLine,
      lastSync: new Date().toISOString(),
      isCloudEnabled: isSupabaseConfigured,
      node: 'ALPHA-HUB-01'
    };
  },

  async getTerminalContext(phone: string) {
    // Core finds the data in its validated memory/cache
    const crew = MOCK_DB.crews.find(c => c.phone === phone);
    if (!crew) throw new Error("UNAUTHORIZED_OPERATOR");
    
    const activeTrip = MOCK_DB.trips.find(t => t.conductorId === crew.id && t.status === TripStatus.ACTIVE);
    const route = activeTrip ? MOCK_DB.routes.find(r => r.id === activeTrip.routeId) : null;
    const vehicle = activeTrip ? MOCK_DB.vehicles.find(v => v.id === activeTrip.vehicleId) : null;

    return { operator: crew, activeTrip, route, vehicle };
  },

  // --- COMMANDS (Intent-Based Writes) ---

  async dispatch(tripId: string) {
    return await MOSCore.dispatchTrip(tripId);
  },

  async ticket(tripId: string, phone: string, amount: number) {
    return await MOSCore.issueTicket({ tripId, phone, amount });
  },

  async complete(tripId: string) {
    return await MOSService.updateTripStatus(tripId, TripStatus.COMPLETED);
  }
};

/**
 * PRODUCTION BRIDGE: 
 * The secure relay for cross-origin or iframed spoke terminals.
 */
if (typeof window !== 'undefined') {
  (window as any).LyncMOS = LyncMOS;

  window.addEventListener('message', async (event) => {
    const { type, payload, requestId } = event.data;

    if (type?.startsWith('MOS_COMMAND:')) {
      const methodName = type.replace('MOS_COMMAND:', '');
      try {
        if (typeof (LyncMOS as any)[methodName] !== 'function') {
           throw new Error(`METHOD_NOT_SUPPORTED: ${methodName}`);
        }

        const result = await (LyncMOS as any)[methodName](...(payload || []));
        
        event.source?.postMessage({
          type: `MOS_RESPONSE:${requestId}`,
          success: true,
          data: result
        }, { targetOrigin: "*" });
      } catch (err: any) {
        event.source?.postMessage({
          type: `MOS_RESPONSE:${requestId}`,
          success: false,
          error: err.message
        }, { targetOrigin: "*" });
      }
    }
  });

  // Forward all Hub events to Spokes
  bus.on('*', (data: any, eventName: string) => {
    const packet = { type: 'MOS_EVENT', eventName, data };
    window.parent.postMessage(packet, '*');
    if (window.opener) window.opener.postMessage(packet, '*');
  });
}
