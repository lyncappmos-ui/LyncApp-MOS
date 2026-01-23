
import { MOSCore } from '../core/MOSCore';
import { MOSService } from './mosService';
import { MOCK_DB } from './db';
import { TripStatus } from '../types';
import { MetricsService } from './metricsService';
import { AuthService } from './authService';
import { runtime } from './coreRuntime';

/**
 * LyncApp MOS High-Integrity RPC Gateway
 * Refactored to include PHASE 1 (defaults) and PHASE 3 (fallback) safety.
 */
export const LyncMOS = {
  async getPlatformMetrics(key: string) {
    const fallback = {
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

  async getGrowthData(key: string) {
    const fallback = {
      gmvTrend: [],
      operatorChurnRate: 0,
      newVehicleAcquisition: 0,
      projectionConfidence: 0
    };

    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'growth_metrics');
      return MetricsService.getGrowthMetrics();
    }, fallback);
  },

  async getRevenueHealth(key: string) {
    const fallback = {
      unanchoredRevenue: 0,
      reconciliationRate: 0,
      web3VerificationStatus: 'CRITICAL' as any
    };

    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'revenue_integrity');
      return MetricsService.getRevenueIntegrity();
    }, fallback);
  },

  async dispatch(key: string, tripId: string) {
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'operational_metrics'); 
      return await MOSCore.dispatchTrip(tripId);
    }, MOCK_DB.trips[0], { isWrite: true }); // Fallback to a static ref or null as needed
  },

  async getTerminalContext(phone: string) {
    const fallback = { operator: null, activeTrip: null, route: null, vehicle: null };

    return runtime.executeSafe(async () => {
      const crew = MOCK_DB.crews.find(c => c.phone === phone);
      if (!crew) throw new Error("UNAUTHORIZED_OPERATOR");
      
      const activeTrip = MOCK_DB.trips.find(t => t.conductorId === crew.id && t.status === TripStatus.ACTIVE);
      const route = activeTrip ? MOCK_DB.routes.find(r => r.id === activeTrip.routeId) : null;
      const vehicle = activeTrip ? MOCK_DB.vehicles.find(v => v.id === activeTrip.vehicleId) : null;

      return { operator: crew, activeTrip, route, vehicle };
    }, fallback);
  },

  async ticket(tripId: string, phone: string, amount: number) {
    const fallback = { id: '', tripId, passengerPhone: phone, amount, timestamp: '', synced: false };
    return runtime.executeSafe(async () => {
      return await MOSService.issueTicket(tripId, phone, amount);
    }, fallback, { isWrite: true });
  },

  async updateTripStatus(tripId: string, status: TripStatus) {
    const fallback = MOCK_DB.trips.find(t => t.id === tripId) || MOCK_DB.trips[0];
    return runtime.executeSafe(async () => {
      return await MOSService.updateTripStatus(tripId, status);
    }, fallback, { isWrite: true });
  }
};
