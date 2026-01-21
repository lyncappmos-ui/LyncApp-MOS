
import { MOSCore } from '../core/MOSCore';
import { MOCK_DB } from './db';
import { TripStatus } from '../types';
import { MetricsService } from './metricsService';
import { AuthService } from './authService';

export const LyncMOS = {
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

  async dispatch(key: string, tripId: string) {
    AuthService.authorize(key, 'operational_metrics'); 
    return await MOSCore.dispatchTrip(tripId);
  },

  async getTerminalContext(phone: string) {
    const crew = MOCK_DB.crews.find(c => c.phone === phone);
    if (!crew) throw new Error("E401: UNAUTHORIZED_OPERATOR");
    
    const activeTrip = MOCK_DB.trips.find(t => t.conductorId === crew.id && t.status === TripStatus.ACTIVE);
    const route = activeTrip ? MOCK_DB.routes.find(r => r.id === activeTrip.routeId) : null;
    const vehicle = activeTrip ? MOCK_DB.vehicles.find(v => v.id === activeTrip.vehicleId) : null;

    return { operator: crew, activeTrip, route, vehicle };
  },

  async ticket(tripId: string, phone: string, amount: number) {
    return await MOSCore.issueTicket({ tripId, phone, amount });
  }
};
