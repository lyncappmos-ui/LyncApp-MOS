
-- LyncApp MOS Full Production Schema
-- Run this in your Supabase SQL Editor

-- 1. Saccos & Branches
CREATE TABLE saccos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE branches (
    id TEXT PRIMARY KEY,
    sacco_id TEXT REFERENCES saccos(id),
    name TEXT NOT NULL,
    location TEXT NOT NULL
);

-- 2. Infrastructure (Routes & Vehicles)
CREATE TABLE routes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    base_fare NUMERIC NOT NULL,
    segments TEXT[]
);

CREATE TABLE vehicles (
    id TEXT PRIMARY KEY,
    plate TEXT NOT NULL UNIQUE,
    sacco_id TEXT REFERENCES saccos(id),
    branch_id TEXT REFERENCES branches(id),
    capacity INTEGER NOT NULL,
    type TEXT NOT NULL,
    last_location TEXT
);

-- 3. Human Capital (Crews)
CREATE TABLE crews (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT NOT NULL,
    trust_score NUMERIC DEFAULT 100,
    incentive_balance NUMERIC DEFAULT 0
);

-- 4. Operations (Trips & Tickets)
CREATE TABLE trips (
    id TEXT PRIMARY KEY,
    route_id TEXT REFERENCES routes(id),
    vehicle_id TEXT REFERENCES vehicles(id),
    driver_id TEXT REFERENCES crews(id),
    conductor_id TEXT REFERENCES crews(id),
    branch_id TEXT REFERENCES branches(id),
    status TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    total_revenue NUMERIC DEFAULT 0,
    ticket_count INTEGER DEFAULT 0
);

CREATE TABLE tickets (
    id TEXT PRIMARY KEY,
    trip_id TEXT REFERENCES trips(id),
    passenger_phone TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    synced BOOLEAN DEFAULT TRUE
);

-- 5. System Logs & Ledger
CREATE TABLE sms_logs (
    id TEXT PRIMARY KEY,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_anchors (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    sacco_id TEXT REFERENCES saccos(id),
    revenue_hash TEXT NOT NULL,
    tx_id TEXT,
    verified BOOLEAN DEFAULT TRUE,
    operation_count INTEGER NOT NULL
);

CREATE TABLE incentive_transactions (
    id TEXT PRIMARY KEY,
    operator_id TEXT REFERENCES crews(id),
    amount NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
