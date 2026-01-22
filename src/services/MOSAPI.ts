
import { MOSCore } from '../core/MOSCore';
import { MOSService } from './mosService';
import { MOCK_DB } from './db';
import { TripStatus } from '../types';
import { MetricsService } from './metricsService';
import { AuthService } from './authService';
import { runtime } from './coreRuntime';

/**
 * LyncApp MOS High-Integrity RPC Gateway
 * Production Ready Interface for all Platform Consumers.
 */
export const LyncMOS = {
  async getPlatformMetrics(key: string) {
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'operational_metrics');
      return MetricsService.getPlatformOperations();
    });
  },

  async getGrowthData(key: string) {
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'growth_metrics');
      return MetricsService.getGrowthMetrics();
    });
  },

  async getRevenueHealth(key: string) {
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'revenue_integrity');
      return MetricsService.getRevenueIntegrity();
    });
  },

  async dispatch(key: string, tripId: string) {
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'operational_metrics'); 
      return await MOSCore.dispatchTrip(tripId);
    }, { isWrite: true });
  },

  async getTerminalContext(phone: string) {
    return runtime.executeSafe(async () => {
      const crew = MOCK_DB.crews.find(c => c.phone === phone);
      if (!crew) throw new Error("UNAUTHORIZED_OPERATOR");
      
      const activeTrip = MOCK_DB.trips.find(t => t.conductorId === crew.id && t.status === TripStatus.ACTIVE);
      const route = activeTrip ? MOCK_DB.routes.find(r => r.id === activeTrip.routeId) : null;
      const vehicle = activeTrip ? MOCK_DB.vehicles.find(v => v.id === activeTrip.vehicleId) : null;

      return { operator: crew, activeTrip, route, vehicle };
    });
  },

  async ticket(tripId: string, phone: string, amount: number) {
    return runtime.executeSafe(async () => {
      return await MOSService.issueTicket(tripId, phone, amount);
    }, { isWrite: true });
  },

  async updateTripStatus(tripId: string, status: TripStatus) {
    return runtime.executeSafe(async () => {
      return await MOSService.updateTripStatus(tripId, status);
    }, { isWrite: true });
  }
};
