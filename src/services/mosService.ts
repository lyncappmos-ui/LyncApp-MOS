
import { MOCK_DB } from './db';
import { bus, MOSEvents } from './eventBus';
import { TripStatus, Ticket, SmsStatus, SmsLog, DailyAnchor } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * LyncApp MOS Core - Business Logic Service
 * Refactored to handle database operations as the primary source of truth.
 */
export class MOSService {
  private static isOnline = true;

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
}
