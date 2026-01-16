
import { SACCO, Branch, Vehicle, CrewMember, Route, Trip, Ticket, SmsLog, DailyAnchor, TripStatus, IncentiveTransaction } from '../types';

export const MOCK_DB = {
  saccos: [
    { id: 's1', name: 'Super Metro', code: 'SMETRO' }
  ] as SACCO[],
  branches: [
    { id: 'b1', saccoId: 's1', name: 'CBD Station', location: 'Nairobi CBD' },
    { id: 'b2', saccoId: 's1', name: 'Thika Branch', location: 'Thika Town' },
    { id: 'b3', saccoId: 's1', name: 'Juja Terminal', location: 'Juja' }
  ] as Branch[],
  vehicles: [
    { id: 'v1', plate: 'KCT 918R', saccoId: 's1', branchId: 'b1', capacity: 33, type: 'Bus', lastLocation: 'CBD' },
    { id: 'v2', plate: 'KDG 560X', saccoId: 's1', branchId: 'b1', capacity: 14, type: 'Matatu', lastLocation: 'Umoja' },
    { id: 'v3', plate: 'KCN 741Z', saccoId: 's1', branchId: 'b2', capacity: 14, type: 'Matatu', lastLocation: 'Thika' },
    { id: 'v4', plate: 'KDB 433Y', saccoId: 's1', branchId: 'b1', capacity: 14, type: 'Matatu', lastLocation: 'CBD' },
    { id: 'v5', plate: 'KDM 130Y', saccoId: 's1', branchId: 'b2', capacity: 33, type: 'Bus', lastLocation: 'CBD' }
  ] as Vehicle[],
  crews: [
    { id: 'c1', name: 'Mike Ochieng', role: 'DRIVER', phone: '254700000001', trustScore: 92, incentiveBalance: 450 },
    { id: 'c2', name: 'Patrick Ndungu', role: 'DRIVER', phone: '254700000002', trustScore: 88, incentiveBalance: 120 },
    { id: 'c3', name: 'James Kamau', role: 'DRIVER', phone: '254700000003', trustScore: 95, incentiveBalance: 890 },
    { id: 'c4', name: 'Alice Wambui', role: 'CONDUCTOR', phone: '254700000004', trustScore: 98, incentiveBalance: 1250 }
  ] as CrewMember[],
  routes: [
    { id: 'r1', name: 'Route 105E (CBD - Umoja)', code: '105E', origin: 'Umoja', destination: 'CBD', baseFare: 50, segments: ['Umoja Inner', 'Umoja Outer', 'Donholm', 'Jogoo Rd', 'CBD'] },
    { id: 'r2', name: 'Route 237 (CBD - Thika)', code: '237', origin: 'Thika', destination: 'CBD', baseFare: 100, segments: ['Thika', 'Juja', 'Ruiru', 'Safari Park', 'CBD'] }
  ] as Route[],
  trips: [
    { id: 'TRP-2026-00291', routeId: 'r1', vehicleId: 'v1', driverId: 'c1', conductorId: 'c4', branchId: 'b1', status: TripStatus.READY, scheduledTime: '10:15 AM', totalRevenue: 12500, ticketCount: 250 },
    { id: 'TRP-2026-00290', routeId: 'r1', vehicleId: 'v2', driverId: 'c2', conductorId: 'c4', branchId: 'b1', status: TripStatus.ACTIVE, scheduledTime: '10:45 AM', totalRevenue: 8400, ticketCount: 168 },
    { id: 'TRP-2026-00239', routeId: 'r2', vehicleId: 'v3', driverId: 'c3', conductorId: 'c4', branchId: 'b2', status: TripStatus.READY, scheduledTime: '11:00 AM', totalRevenue: 15600, ticketCount: 156 }
  ] as Trip[],
  tickets: [] as Ticket[],
  smsLogs: [] as SmsLog[],
  dailyAnchors: [] as DailyAnchor[],
  incentiveTransactions: [] as IncentiveTransaction[]
};
