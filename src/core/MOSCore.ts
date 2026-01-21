
import { TripStatus, Trip, Ticket } from '../types';
import { MOCK_DB } from '../services/db';
import { bus, MOSEvents } from '../services/eventBus';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export class MOSCore {
  private static REVENUE_LOCK_THRESHOLD = 50000;
  private static TRUST_DECAY_RATE = 0.001; 

  static async canDispatch(vehicleId: string): Promise<{ allowed: boolean; reason?: string }> {
    const trip = MOCK_DB.trips.find(t => t.vehicleId === vehicleId && t.status === TripStatus.COMPLETED);
    const unanchoredRevenue = trip ? trip.totalRevenue : 0; 
    
    if (unanchoredRevenue > this.REVENUE_LOCK_THRESHOLD) {
      return { 
        allowed: false, 
        reason: `REVENUE_LOCK: KES ${unanchoredRevenue} pending anchor.` 
      };
    }
    return { allowed: true };
  }

  static async dispatchTrip(tripId: string): Promise<Trip> {
    const trip = MOCK_DB.trips.find(t => t.id === tripId);
    if (!trip) throw new Error("TRIP_NOT_FOUND");
    
    const gate = await this.canDispatch(trip.vehicleId);
    if (!gate.allowed) throw new Error(gate.reason);

    trip.status = TripStatus.ACTIVE;
    trip.actualStartTime = new Date().toISOString();

    if (isSupabaseConfigured) {
      await supabase.from('trips').update({ status: TripStatus.ACTIVE }).eq('id', tripId);
    }

    bus.emit(MOSEvents.TRIP_STARTED, trip);
    return trip;
  }

  static async issueTicket(params: { tripId: string; phone: string; amount: number }): Promise<Ticket> {
    const trip = MOCK_DB.trips.find(t => t.id === params.tripId);
    if (!trip || trip.status !== TripStatus.ACTIVE) throw new Error("TRIP_NOT_ACTIVE");

    const ticket: Ticket = {
      id: `T-${Math.random().toString(36).substring(7).toUpperCase()}`,
      tripId: params.tripId,
      passengerPhone: params.phone,
      amount: params.amount,
      timestamp: new Date().toISOString(),
      synced: true
    };

    trip.totalRevenue += params.amount;
    trip.ticketCount += 1;

    bus.emit(MOSEvents.TICKET_ISSUED, ticket);
    return ticket;
  }

  static applySystemicTrustDecay() {
    MOCK_DB.crews.forEach(crew => {
      crew.trustScore = Math.max(0, crew.trustScore * (1 - this.TRUST_DECAY_RATE));
    });
    bus.emit(MOSEvents.TRUST_UPDATED, { scope: 'SYSTEM_WIDE' });
  }
}
