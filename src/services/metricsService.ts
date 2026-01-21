
import { MOCK_DB } from './db';
import { 
  PlatformOperationalMetrics, 
  PlatformGrowthMetrics, 
  RevenueIntegrityReport,
  TripStatus 
} from '../types';

export class MetricsService {
  static getPlatformOperations(): PlatformOperationalMetrics {
    const activeTrips = MOCK_DB.trips.filter(t => t.status === TripStatus.ACTIVE);
    const totalTickets = MOCK_DB.trips.reduce((acc, t) => acc + t.ticketCount, 0);
    
    return {
      activeTripCount: activeTrips.length,
      globalTicketVolume: totalTickets,
      systemLoadFactor: 0.78,
      lastAnchorTimestamp: MOCK_DB.dailyAnchors[0]?.date || new Date().toISOString()
    };
  }

  static getGrowthMetrics(): PlatformGrowthMetrics {
    const gmvTrend = [
      { date: '2026-05-01', total: 450000 },
      { date: '2026-05-02', total: 485000 },
      { date: '2026-05-03', total: 520000 }
    ];

    return {
      gmvTrend,
      operatorChurnRate: 0.02,
      newVehicleAcquisition: 12,
      projectionConfidence: 0.94
    };
  }

  static getRevenueIntegrity(): RevenueIntegrityReport {
    const totalRevenue = MOCK_DB.trips.reduce((acc, t) => acc + t.totalRevenue, 0);
    const anchoredRevenue = 0; // Simplified for backend testing

    return {
      unanchoredRevenue: totalRevenue - anchoredRevenue,
      reconciliationRate: 0.998,
      web3VerificationStatus: 'OPTIMAL'
    };
  }
}
