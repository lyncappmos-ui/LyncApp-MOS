
"use client";

import React, { useState } from 'react';
import { Plus, TrendingUp, ShieldCheck, Cpu, MapPin, Sparkles, Send, MessageCircle, AlertCircle, RefreshCcw } from 'lucide-react';
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const context = JSON.stringify({
        trips: MOCK_DB.trips,
        revenue: MOCK_DB.trips.reduce((acc, t) => acc + t.totalRevenue, 0),
        tickets: MOCK_DB.trips.reduce((acc, t) => acc + t.ticketCount, 0),
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `As the LyncApp MOS Intelligence engine, analyze this operational context: ${context}. 
                   Answer the user's request: ${aiQuery}. Keep it concise and professional.`,
      });

      setAiResponse(response.text || "Unable to generate a response at this time.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiResponse("Intelligence Engine is currently offline or the API key is invalid.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Operations Command</h1>
          <p className="text-slate-500 font-medium">Real-time mobility orchestration and revenue monitoring.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleAnchor}
            disabled={anchoring}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {anchoring ? <RefreshCcw size={18} className="animate-spin" /> : <ShieldCheck size={18} className="text-blue-400" />}
            <span>{anchoring ? 'Anchoring...' : 'Daily Closure'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-3xl font-black text-slate-900">{s.count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center">
                  <TrendingUp className="mr-2 text-blue-500" size={18} /> Active Dispatch Stream
                </h3>
             </div>
             <div className="divide-y divide-slate-50">
               {trips.filter(t => t.status !== TripStatus.COMPLETED).map(trip => (
                 <div key={trip.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                     <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><MapPin size={20} /></div>
                     <div>
                       <p className="text-xs font-black text-slate-400 uppercase">{trip.id}</p>
                       <p className="font-bold text-slate-900">Vehicle {trip.vehicleId}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-black text-slate-900">KSh {trip.totalRevenue.toLocaleString()}</p>
                     <p className="text-[10px] font-bold text-blue-500 uppercase">{trip.status}</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Cpu size={120} /></div>
            <h3 className="text-xl font-black mb-4 flex items-center uppercase tracking-tighter">
              <Sparkles className="mr-2 text-blue-200" size={20} /> MOS Intelligence
            </h3>
            <p className="text-sm text-blue-100 mb-6 leading-relaxed">
              Ask Gemini about fleet efficiency, revenue leaks, or route performance.
            </p>
            <div className="relative mb-4">
              <input 
                type="text" 
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                placeholder="Analyze current load..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 placeholder:text-blue-200"
              />
              <button 
                onClick={handleAskAi}
                disabled={aiLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                {aiLoading ? <RefreshCcw size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            
            {aiResponse && (
              <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/10 text-xs leading-relaxed animate-in slide-in-from-bottom-2">
                <div className="flex items-center mb-2 font-black uppercase text-[10px] text-blue-200">
                  <MessageCircle size={12} className="mr-1" /> Recommendation:
                </div>
                {aiResponse}
              </div>
            )}
          </div>

          <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
            <h4 className="font-black text-amber-900 text-xs uppercase flex items-center mb-2 tracking-widest">
              <AlertCircle size={14} className="mr-2" /> System Alert
            </h4>
            <p className="text-[11px] text-amber-800/80 leading-relaxed font-medium">
              3 vehicles have exceeded the 12-hour operational window without a Web3 revenue anchor. Anchor now to prevent trust score decay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
