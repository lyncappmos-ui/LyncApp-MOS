
import { MOCK_DB } from '../services/db';
import { TripStatus } from '../types';

/**
 * LyncApp MOS Core - Initial Operational Seed
 */
export function performInitialSeed() {
  console.log("🌱 MOS Core: Seeding operational data...");

  // Ensure MOCK_DB has minimum viable data if empty
  if (MOCK_DB.saccos.length === 0) {
    MOCK_DB.saccos.push({ id: 's1', name: 'Super Metro', code: 'SMETRO' });
  }

  if (MOCK_DB.branches.length === 0) {
    MOCK_DB.branches.push(
      { id: 'b1', saccoId: 's1', name: 'CBD Terminal', location: 'Nairobi CBD' },
      { id: 'b2', saccoId: 's1', name: 'Westlands Station', location: 'Westlands' }
    );
  }

  if (MOCK_DB.crews.length === 0) {
    MOCK_DB.crews.push(
      { id: 'c1', name: 'John Kamau', role: 'DRIVER', phone: '254700000001', trustScore: 95, incentiveBalance: 500 },
      { id: 'c2', name: 'Mary Atieno', role: 'CONDUCTOR', phone: '254700000002', trustScore: 98, incentiveBalance: 1200 }
    );
  }

  if (MOCK_DB.trips.length === 0) {
    MOCK_DB.trips.push({
      id: 'TRP-INITIAL-001',
      routeId: 'r1',
      vehicleId: 'v1',
      driverId: 'c1',
      conductorId: 'c2',
      branchId: 'b1',
      status: TripStatus.READY,
      scheduledTime: '08:00 AM',
      totalRevenue: 0,
      ticketCount: 0
    });
  }

  console.log("✅ Seed complete.");
}

// Fix: Use globalThis to safely access require and module to check if the script is run directly in a Node.js context
const nodeRequire = (globalThis as any).require;
const nodeModule = (globalThis as any).module;
if (nodeRequire?.main === nodeModule) {
  performInitialSeed();
}
