
import { MOCK_DB } from './db';
import { bus, MOSEvents } from './eventBus';
import { TripStatus, Ticket, SmsStatus, SmsLog, DailyAnchor, SACCO, Branch, CrewMember, Vehicle } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * LyncApp MOS Core - Business Logic Service
 * Refactored to handle database operations as the primary source of truth.
 */
export class MOSService {
  private static isOnline = true;

  // --- Seed / Database Service Functions ---

  static async addSaccoSettings(sacco: SACCO) {
    MOCK_DB.saccos = [sacco];
    if (isSupabaseConfigured && supabase) {
      await supabase.from('saccos').upsert([sacco]);
    }
    return sacco;
  }

  static async addBranch(branch: Branch) {
    MOCK_DB.branches.push(branch);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('branches').insert([{
        id: branch.id,
        sacco_id: branch.saccoId,
        name: branch.name,
        location: branch.location
      }]);
    }
    return branch;
  }

  static async addCrew(crew: CrewMember) {
    MOCK_DB.crews.push(crew);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('crews').insert([{
        id: crew.id,
        name: crew.name,
        role: crew.role,
        phone: crew.phone,
        trust_score: crew.trustScore,
        incentive_balance: crew.incentiveBalance
      }]);
    }
    return crew;
  }

  static async addVehicle(vehicle: Vehicle) {
    MOCK_DB.vehicles.push(vehicle);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('vehicles').insert([{
        id: vehicle.id,
        plate: vehicle.plate,
        sacco_id: vehicle.saccoId,
        branch_id: vehicle.branchId,
        capacity: vehicle.capacity,
        type: vehicle.type,
        last_location: vehicle.lastLocation
      }]);
    }
    return vehicle;
  }

  static async addSMSMetrics(metrics: { sent: number; delivered: number; failed: number }) {
    // SMS Metrics usually involves batching logs; for seeding we'll create representative logs
    const logs: SmsLog[] = [];
    for (let i = 0; i < metrics.sent; i++) {
      logs.push({
        id: `SMS-SEED-${Math.random().toString(36).substring(7)}`,
        phoneNumber: '254000000000',
        message: 'Seed Metric Log',
        status: i < metrics.delivered ? SmsStatus.DELIVERED : SmsStatus.FAILED,
        retryCount: 0,
        timestamp: new Date().toISOString()
      });
    }
    MOCK_DB.smsLogs.push(...logs);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('sms_logs').insert(logs.map(l => ({
        id: l.id,
        phone_number: l.phoneNumber,
        message: l.message,
        status: l.status,
        retry_count: l.retryCount,
        timestamp: l.timestamp
      })));
    }
    return true;
  }

  // --- Operational Logic ---

  static async updateTripStatus(tripId: string, status: TripStatus) {
    const trip = MOCK_DB.trips.find(t => t.id === tripId);
    if (!trip) throw new Error("TRIP_NOT_FOUND");

    const updateData: any = { status };
    if (status === TripStatus.ACTIVE) updateData.actual_start_time = new Date().toISOString();
    if (status === TripStatus.COMPLETED) updateData.actual_end_time = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('trips').update(updateData).eq('id', tripId);
      if (error) console.warn("Supabase Sync Failed, using local state.");
    }

    trip.status = status;
    if (status === TripStatus.ACTIVE) {
      trip.actualStartTime = updateData.actual_start_time;
      bus.emit(MOSEvents.TRIP_STARTED, trip);
    } else if (status === TripStatus.COMPLETED) {
      trip.actualEndTime = updateData.actual_end_time;
      bus.emit(MOSEvents.TRIP_COMPLETED, trip);
    }
    return trip;
  }

  static async issueTicket(tripId: string, phone: string, amount: number) {
    const trip = MOCK_DB.trips.find(t => t.id === tripId);
    if (!trip) throw new Error("TRIP_NOT_FOUND");

    const ticket: Ticket = {
      id: `LYNC-${Math.random().toString(36).substring(7).toUpperCase()}`,
      tripId,
      passengerPhone: phone,
      amount,
      timestamp: new Date().toISOString(),
      synced: isSupabaseConfigured
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('tickets').insert([{
          id: ticket.id,
          trip_id: ticket.tripId,
          passenger_phone: ticket.passengerPhone,
          amount: ticket.amount,
          timestamp: ticket.timestamp,
          synced: true
        }]);
        
        await supabase.from('trips').update({ 
          total_revenue: trip.totalRevenue + amount, 
          ticket_count: trip.ticketCount + 1 
        }).eq('id', tripId);
      } catch (e) {
        console.error("Supabase Write Error", e);
      }
    }

    trip.totalRevenue += amount;
    trip.ticketCount += 1;
    
    bus.emit(MOSEvents.TICKET_ISSUED, ticket);
    return ticket;
  }

  static async performDailyClosure(saccoId: string) {
    const today = new Date().toISOString().split('T')[0];
    const dailyTrips = MOCK_DB.trips.filter(t => t.status === TripStatus.COMPLETED);
    
    const anchor: DailyAnchor = {
      id: `ANCHOR-${today}-${Math.random().toString(36).substring(7)}`,
      date: today,
      saccoId,
      revenueHash: 'verified_checksum_placeholder',
      verified: true,
      operationCount: dailyTrips.length
    };

    if (isSupabaseConfigured && supabase) {
      // Fix: Corrected property access from 'anchor.sacco_id' to 'anchor.saccoId' to match DailyAnchor type definition
      await supabase.from('daily_anchors').insert([{
        id: anchor.id,
        date: anchor.date,
        sacco_id: anchor.saccoId,
        revenue_hash: anchor.revenueHash,
        verified: anchor.verified,
        operation_count: anchor.operationCount
      }]);
    }
    
    MOCK_DB.dailyAnchors.unshift(anchor);
    bus.emit(MOSEvents.REVENUE_ANCHORED, anchor);
    return anchor;
  }

  static async provisionCloud() {
    if (!isSupabaseConfigured) throw new Error("Supabase not configured");
    console.log("Provisioning Cloud from Local MOCK_DB...");
    await supabase.from('saccos').upsert(MOCK_DB.saccos);
    return true;
  }

  static async getVerifiableTrust(operatorId: string) {
    const operator = MOCK_DB.crews.find(c => c.id === operatorId);
    if (!operator) return null;
    return {
      issuer: "did:lync:mos-authority",
      subject: operatorId,
      claims: { trustScore: operator.trustScore },
      signature: "proof_placeholder",
      proofType: "EIP712"
    };
  }
}
