
import { MOCK_DB } from './db';
import { bus, MOSEvents } from './eventBus';
import { TripStatus, Ticket, SmsStatus, SmsLog, DailyAnchor, IncentiveTransaction } from '../types';
import { web3Adapter } from './web3Adapter';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export class MOSService {
  private static isOnline = true;
  private static offlineQueue: Ticket[] = [];

  /**
   * Pushes all local MOCK_DB data to Supabase to initialize the cloud instance.
   */
  static async provisionCloud() {
    if (!isSupabaseConfigured) throw new Error("Supabase not configured");

    console.log("LyncApp MOS: Provisioning Cloud Database...");

    // 1. Provision Saccos
    await supabase.from('saccos').upsert(MOCK_DB.saccos);

    // 2. Provision Branches
    await supabase.from('branches').upsert(MOCK_DB.branches.map(b => ({
      id: b.id,
      sacco_id: b.saccoId,
      name: b.name,
      location: b.location
    })));

    // 3. Provision Routes
    await supabase.from('routes').upsert(MOCK_DB.routes.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      origin: r.origin,
      destination: r.destination,
      base_fare: r.baseFare,
      segments: r.segments
    })));

    // 4. Provision Crews
    await supabase.from('crews').upsert(MOCK_DB.crews.map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      phone: c.phone,
      trust_score: c.trustScore,
      incentive_balance: c.incentiveBalance
    })));

    // 5. Provision Vehicles
    await supabase.from('vehicles').upsert(MOCK_DB.vehicles.map(v => ({
      id: v.id,
      plate: v.plate,
      sacco_id: v.saccoId,
      branch_id: v.branchId,
      capacity: v.capacity,
      type: v.type,
      last_location: v.lastLocation
    })));

    // 6. Provision Trips
    await supabase.from('trips').upsert(MOCK_DB.trips.map(t => ({
      id: t.id,
      route_id: t.routeId,
      vehicle_id: t.vehicleId,
      driver_id: t.driverId,
      conductor_id: t.conductorId,
      branch_id: t.branchId,
      status: t.status,
      scheduled_time: t.scheduledTime,
      total_revenue: t.totalRevenue,
      ticket_count: t.ticketCount
    })));

    console.log("LyncApp MOS: Cloud provisioning complete.");
    return true;
  }

  static async hydrate() {
    if (!isSupabaseConfigured) return;

    try {
      console.log("LyncApp MOS: Hydrating data from Supabase...");
      
      const [tripsRes, crewsRes, routesRes, anchorsRes, txRes] = await Promise.all([
        supabase.from('trips').select('*'),
        supabase.from('crews').select('*'),
        supabase.from('routes').select('*'),
        supabase.from('daily_anchors').select('*').order('date', { ascending: false }),
        supabase.from('incentive_transactions').select('*').order('timestamp', { ascending: false })
      ]);

      if (tripsRes.data && tripsRes.data.length > 0) {
        MOCK_DB.trips = tripsRes.data.map((t: any) => ({
          id: t.id,
          routeId: t.route_id,
          vehicleId: t.vehicle_id,
          driverId: t.driver_id,
          conductorId: t.conductor_id,
          branchId: t.branch_id,
          status: t.status as TripStatus,
          scheduledTime: t.scheduled_time,
          actualStartTime: t.actual_start_time,
          actualEndTime: t.actual_end_time,
          totalRevenue: Number(t.total_revenue),
          ticketCount: Number(t.ticket_count)
        }));
      }

      if (crewsRes.data && crewsRes.data.length > 0) {
        MOCK_DB.crews = crewsRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          phone: c.phone,
          trustScore: Number(c.trust_score),
          incentiveBalance: Number(c.incentive_balance)
        }));
      }

      if (routesRes.data && routesRes.data.length > 0) {
        MOCK_DB.routes = routesRes.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          code: r.code,
          origin: r.origin,
          destination: r.destination,
          baseFare: Number(r.base_fare),
          segments: r.segments || []
        }));
      }

      if (anchorsRes.data && anchorsRes.data.length > 0) {
        MOCK_DB.dailyAnchors = anchorsRes.data.map((a: any) => ({
          id: a.id,
          date: a.date,
          saccoId: a.sacco_id,
          revenueHash: a.revenue_hash,
          txId: a.tx_id,
          verified: a.verified,
          operationCount: a.operation_count
        }));
      }

      if (txRes.data && txRes.data.length > 0) {
        MOCK_DB.incentiveTransactions = txRes.data.map((tx: any) => ({
          id: tx.id,
          operatorId: tx.operator_id,
          amount: Number(tx.amount),
          reason: tx.reason,
          timestamp: tx.timestamp
        }));
      }

      bus.emit(MOSEvents.SYNC_REQUIRED, { hydrated: true });
    } catch (error) {
      console.error("Hydration failed:", error);
    }
  }

  static setOnline(status: boolean) {
    this.isOnline = status;
    if (this.isOnline && this.offlineQueue.length > 0) {
      this.syncOfflineData();
    }
    bus.emit(MOSEvents.SYNC_REQUIRED, { isOnline: this.isOnline });
  }

  private static async syncOfflineData() {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('tickets').insert(this.offlineQueue.map(t => ({
        id: t.id,
        trip_id: t.tripId,
        passenger_phone: t.passengerPhone,
        amount: t.amount,
        timestamp: t.timestamp,
        synced: true
      })));
      if (!error) this.offlineQueue = [];
    }
  }

  static async updateTripStatus(tripId: string, status: TripStatus) {
    if (isSupabaseConfigured) {
      const updateData: any = { status };
      if (status === TripStatus.ACTIVE) updateData.actual_start_time = new Date().toISOString();
      if (status === TripStatus.COMPLETED) updateData.actual_end_time = new Date().toISOString();
      await supabase.from('trips').update(updateData).eq('id', tripId);
    }

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

    if (isSupabaseConfigured && this.isOnline) {
      await supabase.from('tickets').insert([{
        id: newTicket.id,
        trip_id: newTicket.tripId,
        passenger_phone: newTicket.passengerPhone,
        amount: newTicket.amount,
        timestamp: newTicket.timestamp,
        synced: newTicket.synced
      }]);
      // Update trip revenue in DB
      await supabase.from('trips').update({ 
        total_revenue: trip.totalRevenue + amount, 
        ticket_count: trip.ticketCount + 1 
      }).eq('id', tripId);
    } else if (!this.isOnline) {
      this.offlineQueue.push(newTicket);
    } else {
      MOCK_DB.tickets.push(newTicket);
    }

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

    if (isSupabaseConfigured) {
      await supabase.from('sms_logs').insert([{
        id: log.id,
        phone_number: log.phoneNumber,
        message: log.message,
        status: log.status,
        retry_count: log.retryCount,
        timestamp: log.timestamp
      }]);
    }
    MOCK_DB.smsLogs.push(log);

    setTimeout(async () => {
      log.status = SmsStatus.SENT;
      if (isSupabaseConfigured) {
        await supabase.from('sms_logs').update({ status: SmsStatus.SENT }).eq('id', log.id);
      }
      bus.emit(MOSEvents.SMS_SENT, log);
    }, 1500);
  }

  private static async calculateIncentives(trip: any) {
    const driver = MOCK_DB.crews.find(c => c.id === trip.driverId);
    if (driver) {
      driver.incentiveBalance += 15;
      driver.trustScore = Math.min(100, driver.trustScore + 0.2);
      const tx = {
        id: `TX-${Math.random().toString(36).substring(7)}`,
        operatorId: driver.id,
        amount: 15,
        reason: "Operational Performance",
        timestamp: new Date().toISOString()
      };
      if (isSupabaseConfigured) {
        await supabase.from('incentive_transactions').insert([{
          id: tx.id,
          operator_id: tx.operatorId,
          amount: tx.amount,
          reason: tx.reason,
          timestamp: tx.timestamp
        }]);
        await supabase.from('crews').update({ 
          incentive_balance: driver.incentiveBalance,
          trust_score: driver.trustScore 
        }).eq('id', driver.id);
      }
      MOCK_DB.incentiveTransactions.push(tx);
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

    if (isSupabaseConfigured) {
      await supabase.from('daily_anchors').insert([{
        id: anchor.id,
        date: anchor.date,
        sacco_id: anchor.saccoId,
        revenue_hash: anchor.revenueHash,
        tx_id: anchor.txId,
        verified: anchor.verified,
        operation_count: anchor.operationCount
      }]);
    }
    MOCK_DB.dailyAnchors.unshift(anchor);
    return anchor;
  }

  static async getVerifiableTrust(operatorId: string) {
    const operator = MOCK_DB.crews.find(c => c.id === operatorId);
    if (!operator) return null;
    return await web3Adapter.signTrustCredential(operatorId, operator.trustScore);
  }
}
