"use client";

import React, { useState } from 'react';
import { Plus, TrendingUp, ShieldCheck, Cpu, MapPin, Sparkles, Send, MessageCircle } from 'lucide-react';
import { MOCK_DB } from '../services/db';
import { TripStatus } from '../types';
import { MOSService } from '../services/mosService';
import { GoogleGenAI } from "@google/genai";

const Dashboard: React.FC = () => {
  const [trips, setTrips] = useState(MOCK_DB.trips);
  const [anchoring, setAnchoring] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const stats = [
    { label: 'Active', count: trips.filter(t => t.status === TripStatus.ACTIVE).length, color: 'bg-green-100 text-green-700' },
    { label: 'Ready', count: trips.filter(t => t.status === TripStatus.READY).length, color: 'bg-blue-100 text-blue-700' },
    { label: 'Delayed', count: trips.filter(t => t.status === TripStatus.DELAYED).length, color: 'bg-orange-100 text-orange-700' },
    { label: 'Scheduled', count: trips.filter(t => t.status === TripStatus.SCHEDULED).length, color: 'bg-slate-100 text-slate-700' },
  ];

  const handleStatusChange = async (tripId: string, status: TripStatus) => {
    await MOSService.updateTripStatus(tripId, status);
    setTrips([...MOCK_DB.trips]);
  };

  const handleAnchor = async () => {
    setAnchoring(true);
    try {
      await MOSService.performDailyClosure('s1');
      alert("Daily operation summary anchored to Web3 Ledger. Hash verified.");
    } finally {
      setAnchoring(false);
    }
  };

  const handleAskAi = async () => {
    if (!aiQuery) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.