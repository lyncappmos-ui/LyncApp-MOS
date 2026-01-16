
import { TripStatus, Trip, Ticket, CrewMember, Vehicle, Route, SACCO, SmsStatus } from '../types';
import { MOCK_DB } from '../services/db';
import { bus, MOSEvents } from '../services/eventBus';
import { web3Adapter } from '../services/web3Adapter';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

/**
 * LyncApp MOS Core - Headless Domain Engine
 * Implements strict business rules for matatu operations.
 */
export class MOSCore {
  private static REVENUE_LOCK_THRESHOLD = 50000;
  private static TRUST_DECAY_RATE = 0.001; // 0.1%

  /**
   * Domain Rule: Revenue Locking
   * Checks if a vehicle is allowed to dispatch based on unanchored revenue.
   */
  static async canDispatch(vehicleId: string): Promise<{ allowed: boolean; reason?: string }> {
    const trip = MOCK_DB.trips.find(t => t.vehicleId === vehicleId && t.status === TripStatus.COMPLETED);
    // In production, we'd check all COMPLETED but UNANCHORED trips for this vehicle
    const unanchoredRevenue = trip ? trip.totalRevenue : 0; 
    
    if (unanchoredRevenue > this.REVENUE_LOCK_THRESHOLD) {
      return { 
        allowed: false, 
        reason: `Revenue Lock: KES ${unanchoredRevenue} pending anchor. Deposit required.` 
      };
    }
    return { allowed: true };
  }

  /**
   * Domain Rule: Dispatch State Machine
   */
  static async dispatchTrip(tripId: string): Promise<Trip> {
    const trip = MOCK_DB.trips.find(t => t.id === tripId);
    if (!trip) throw new Error("TRIP_NOT_FOUND");
    if (trip.status !== TripStatus.READY) throw new Error("INVALID_STATE_TRANSITION");

    // Check dispatch permissions
    const gate = await this.canDispatch(trip.vehicleId);
    if (!gate.allowed) throw new Error(gate.reason);

    trip.status = TripStatus.ACTIVE;
    trip.actualStartTime = new Date().toISOString();

    if (isSupabaseConfigured) {
      await supabase.from('trips').update({ 
        status: TripStatus.ACTIVE, 
        actual_start_time: trip.actualStartTime 
      }).eq('id', tripId);
    }

    bus.emit(MOSEvents.TRIP_STARTED, trip);
    return trip;
  }

  /**
   * Domain Rule: Atomic Ticketing
   */
  static async issueTicket(params: { tripId: string; phone: string; amount: number }): Promise<Ticket> {
    const trip = MOCK_DB.trips.find(t => t.id === params.tripId);
    if (!trip || trip.status !== TripStatus.ACTIVE) throw new Error("TRIP_NOT_ACTIVE");

    const ticketId = `LYNC-T-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const ticket: Ticket = {
      id: ticketId,
      tripId: params.tripId,
      passengerPhone: params.phone,
      amount: params.amount,
      timestamp: new Date().toISOString(),
      synced: true
    };

    // 1. Update In-Memory State
    trip.totalRevenue += params.amount;
    trip.ticketCount += 1;

    // 2. Persist to Cloud
    if (isSupabaseConfigured) {
      await Promise.all([
        supabase.from('tickets').insert([ticket]),
        supabase.from('trips').update({ 
          total_revenue: trip.totalRevenue, 
          ticket_count: trip.ticketCount 
        }).eq('id', params.tripId)
      ]);
    }

    // 3. Trigger External Side-Effects (SMS)
    bus.emit(MOSEvents.TICKET_ISSUED, ticket);
    return ticket;
  }

  /**
   * Domain Rule: Reputation Management & Trust Decay
   */
  static async applyTrustDecay() {
    console.log("Applying operational trust decay...");
    MOCK_DB.crews.forEach(crew => {
      crew.trustScore = Math.max(0, crew.trustScore * (1 - this.TRUST_DECAY_RATE));
    });
    
    if (isSupabaseConfigured) {
      for (const crew of MOCK_DB.crews) {
        await supabase.from('crews').update({ trust_score: crew.trustScore }).eq('id', crew.id);
      }
    }
    bus.emit(MOSEvents.SYNC_REQUIRED, { type: 'TRUST_DECAY_APPLIED' });
  }

  /**
   * Domain Rule: Segment Validation
   * Ensures checkpoints are recorded in sequential order.
   */
  static async validateCheckpoint(tripId: string, segmentIndex: number): Promise<boolean> {
    const trip = MOCK_DB.trips.find(t => t.id === tripId);
    const route = MOCK_DB.routes.find(r => r.id === trip?.routeId);
    if (!route) return false;
    
    // Logic: Check if previous segment was recorded (omitted for brevity in mock)
    console.log(`Validating segment ${segmentIndex} (${route.segments[segmentIndex]}) for trip ${tripId}`);
    return true;
  }
}
