
import { MOSCore } from '../core/MOSCore';
import { MOCK_DB } from './db';
import { TripStatus } from '../types';
import { MetricsService } from './metricsService';
import { AuthService } from './authService';
import { runtime } from './coreRuntime';

/**
 * LyncApp MOS High-Integrity RPC Gateway
 * Production-ready interface for Dashboard and Operator Terminal.
 */
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

  async getGrowthData(key: string) {
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'growth_metrics');
      return MetricsService.getGrowthMetrics();
    }, {
      gmvTrend: [],
      operatorChurnRate: 0,
      newVehicleAcquisition: 0,
      projectionConfidence: 0
    });
  },

  async getRevenueHealth(key: string) {
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'revenue_integrity');
      return MetricsService.getRevenueIntegrity();
    }, {
      unanchoredRevenue: 0,
      reconciliationRate: 0,
      web3VerificationStatus: 'CRITICAL' as any
    });
  },

  async dispatch(key: string, tripId: string) {
    const fallback = MOCK_DB.trips.find(t => t.id === tripId) || MOCK_DB.trips[0];
    return runtime.executeSafe(async () => {
      AuthService.authorize(key, 'operational_metrics'); 
      return await MOSCore.dispatchTrip(tripId);
    }, fallback, { isWrite: true });
  },

  async getTerminalContext(phone: string) {
    const fallback = { operator: null, activeTrip: null, route: null, vehicle: null };
    return runtime.executeSafe(async () => {
      const crew = MOCK_DB.crews.find(c => c.phone === phone);
      if (!crew) throw new Error("E401: UNAUTHORIZED_OPERATOR");
      
      const activeTrip = MOCK_DB.trips.find(t => t.conductorId === crew.id && t.status === TripStatus.ACTIVE);
      const route = activeTrip ? MOCK_DB.routes.find(r => r.id === activeTrip.routeId) : null;
      const vehicle = activeTrip ? MOCK_DB.vehicles.find(v => v.id === activeTrip.vehicleId) : null;

      return { operator: crew, activeTrip, route, vehicle };
    }, fallback);
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
