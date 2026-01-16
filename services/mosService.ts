
import { MOCK_DB } from './db';
import { bus, MOSEvents } from './eventBus';
import { TripStatus, Ticket, SmsStatus, SmsLog, DailyAnchor, IncentiveTransaction } from '../types';
import { web3Adapter } from './web3Adapter';

export class MOSService {
  private static isOnline = true;
  private static offlineQueue: Ticket[] = [];

  static setOnline(status: boolean) {
    this.isOnline = status;
    if (this.isOnline && this.offlineQueue.length > 0) {
      this.syncOfflineData();
    }
    bus.emit(MOSEvents.SYNC_REQUIRED, { isOnline: this.isOnline });
  }

  private static syncOfflineData() {
    this.offlineQueue.forEach(ticket => {
      ticket.synced = true;
      MOCK_DB.tickets.push(ticket);
    });
    this.offlineQueue = [];
  }

  static async updateTripStatus(tripId: string, status: TripStatus) {
    const trip = MOCK_DB.trips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    
    trip.status = status;
    if (status === TripStatus.ACTIVE) {
      trip.actualStartTime = new Date().toISOString();
      bus.emit(MOSEvents.TRIP_STARTED, trip);
    } else if (status === TripStatus.COMPLETED) {
      trip.actualEndTime = new Date().toISOString();
      bus.emit(MOSEvents.TRIP_COMPLETED, trip);
      this.calculateIncentives(trip);
    }
    return trip;
  }

  static async issueTicket(tripId: string, phone: string, amount: number) {
    const trip = MOCK_DB.trips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    const route = MOCK_DB.routes.find(r => r.id === trip.routeId);
    const ticketId = `LYNC-${route?.code || 'GEN'}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const newTicket: Ticket = {
      id: ticketId,
      tripId,
      passengerPhone: phone,
      amount,
      timestamp: new Date().toISOString(),
      synced: this.isOnline
    };

    if (this.isOnline) MOCK_DB.tickets.push(newTicket);
    else this.offlineQueue.push(newTicket);

    trip.totalRevenue += amount;
    trip.ticketCount += 1;
    this.sendSmsTicket(newTicket);
    bus.emit(MOSEvents.TICKET_ISSUED, newTicket);
    return newTicket;
  }

  private static async sendSmsTicket(ticket: Ticket) {
    const log: SmsLog = {
      id: `SMS-${Math.random().toString(36).substring(7)}`,
      phoneNumber: ticket.passengerPhone,
      message: `LYNC Ticket: ${ticket.id}. Amt: KES ${ticket.amount}. Trip: ${ticket.tripId}.`,
      status: SmsStatus.PENDING,
      retryCount: 0,
      timestamp: new Date().toISOString()
    };
    MOCK_DB.smsLogs.push(log);
    setTimeout(() => {
      log.status = SmsStatus.SENT;
      bus.emit(MOSEvents.SMS_SENT, log);
    }, 1500);
  }

  private static async calculateIncentives(trip: any) {
    const driver = MOCK_DB.crews.find(c => c.id === trip.driverId);
    if (driver) {
      driver.incentiveBalance += 15;
      driver.trustScore = Math.min(100, driver.trustScore + 0.2);
      MOCK_DB.incentiveTransactions.push({
        id: `TX-${Math.random().toString(36).substring(7)}`,
        operatorId: driver.id,
        amount: 15,
        reason: "Operational Performance",
        timestamp: new Date().toISOString()
      });
    }
    bus.emit(MOSEvents.TRUST_UPDATED, { tripId: trip.id });
  }

  static async performDailyClosure(saccoId: string) {
    const today = new Date().toISOString().split('T')[0];
    const dailyTrips = MOCK_DB.trips.filter(t => t.status === TripStatus.COMPLETED);
    const dailyRevenue = dailyTrips.reduce((acc, t) => acc + t.totalRevenue, 0);

    const dataToHash = JSON.stringify({ today, saccoId, dailyRevenue, ticketCount: MOCK_DB.tickets.length });
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Call Web3 Adapter for Anchoring
    const proof = await web3Adapter.anchorData(hashHex);

    const anchor: DailyAnchor = {
      id: `ANCHOR-${today}-${Math.random().toString(36).substring(7)}`,
      date: today,
      saccoId,
      revenueHash: hashHex,
      txId: proof.txId,
      verified: true,
      operationCount: dailyTrips.length
    };

    MOCK_DB.dailyAnchors.unshift(anchor);
    return anchor;
  }

  static async getVerifiableTrust(operatorId: string) {
    const operator = MOCK_DB.crews.find(c => c.id === operatorId);
    if (!operator) return null;
    return await web3Adapter.signTrustCredential(operatorId, operator.trustScore);
  }
}
