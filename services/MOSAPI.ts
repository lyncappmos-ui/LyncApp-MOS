
import { MOSCore } from '../core/MOSCore';
import { MOCK_DB } from './db';
import { TripStatus } from '../types';
import { MOSService } from './mosService';
import { isSupabaseConfigured } from './supabaseClient';

/**
 * LyncApp MOS Public API Contract (Admin Extension)
 * Strict Read/Write gateway for the Admin Dashboard.
 */
export const LyncMOS = {
  // --- Operational Write API (Intent Based) ---
  async dispatch(tripId: string) {
    // Logic/Validation happens inside MOSCore.dispatchTrip
    return await MOSCore.dispatchTrip(tripId);
  },

  async ticket(tripId: string, phone: string, amount: number) {
    return await MOSCore.issueTicket({ tripId, phone, amount });
  },

  async complete(tripId: string) {
    return await MOSService.updateTripStatus(tripId, TripStatus.COMPLETED);
  },

  // --- Administrative Discovery API (Read Only) ---
  async getSystemStats() {
    const activeTrips = MOCK_DB.trips.filter(t => t.status === TripStatus.ACTIVE);
    const totalRevenue = MOCK_DB.trips.reduce((acc, t) => acc + t.totalRevenue, 0);
    const avgTrust = MOCK_DB.crews.reduce((acc, c) => acc + c.trustScore, 0) / MOCK_DB.crews.length;

    return {
      activeTrips: activeTrips.length,
      totalRevenue,
      avgTrust: Math.round(avgTrust),
      crewCount: MOCK_DB.crews.length,
      fleetCount: MOCK_DB.vehicles.length
    };
  },

  async listTrips(filter?: TripStatus) {
    if (filter) return MOCK_DB.trips.filter(t => t.status === filter);
    return MOCK_DB.trips;
  },

  async getRegistry() {
    return {
      saccos: MOCK_DB.saccos,
      branches: MOCK_DB.branches,
      routes: MOCK_DB.routes,
      vehicles: MOCK_DB.vehicles,
      crews: MOCK_DB.crews
    };
  },

  // --- System Management ---
  async getCoreStatus() {
    return {
      version: '2.5.0-headless',
      environment: isSupabaseConfigured ? 'PRODUCTION' : 'DEVELOPMENT',
      persistence: isSupabaseConfigured ? 'SUPABASE_CLOUD' : 'LOCAL_MEMORY',
      integrityLayer: 'CELO_MAINNET_ACTIVE'
    };
  },

  async performClosure(saccoId: string) {
    return await MOSService.performDailyClosure(saccoId);
  }
};

if (typeof window !== 'undefined') {
  (window as any).LyncMOS = LyncMOS;
}
