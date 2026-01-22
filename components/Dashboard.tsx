
"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, MapPin, Sparkles, Send, MessageCircle, RefreshCcw, TrendingUp } from 'lucide-react';
import { MOCK_DB } from '../services/db';
import { TripStatus, CoreState } from '../types';
import { LyncMOS } from '../services/MOSAPI';
import { GoogleGenAI } from "@google/genai";
import { runtime } from '../services/coreRuntime';

const Dashboard: React.FC = () => {
  const [trips, setTrips] = useState(MOCK_DB.trips);
  const [anchoring, setAnchoring] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [systemState, setSystemState] = useState<CoreState>(runtime.getState());

  useEffect(() => {
    const itv = setInterval(() => setSystemState(runtime.getState()), 1000);
    return () => clearInterval(itv);
  }, []);

  const stats = [
    { label: 'Active', count: trips.filter(t => t.status === TripStatus.ACTIVE).length },
    { label: 'Ready', count: trips.filter(t => t.status === TripStatus.READY).length },
    { label: 'Completed', count: trips.filter(t => t.status === TripStatus.COMPLETED).length },
    { label: 'Revenue', count: trips.reduce((acc, t) => acc + t.totalRevenue, 0) },
  ];

  const handleDispatch = async (tripId: string) => {
    // Correct call to dispatch via standardized API
    const res = await LyncMOS.dispatch('mos_pk_admin_global_7734', tripId);
    if (res.data) setTrips([...MOCK_DB.trips]);
    else if (res.error) alert(res.error.message);
  };

  const handleAskAi = async () => {
    if (!aiQuery) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const context = `System State: ${systemState}. Trips: ${trips.length}. Total Revenue: ${stats[3].count}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `As the LyncApp MOS Intelligence engine. Context: ${context}. User: ${aiQuery}. Help them manage Matatu operations.`,
      });
      setAiResponse(response.text || "Analyzed.");
    } catch (error) {
      setAiResponse("AI Engine degraded.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center">
            MOS Dashboard
            {systemState !== CoreState.READY && (
              <span className="ml-4 px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">
                System {systemState}
              </span>
            )}
          </h1>
          <p className="text-slate-500 font-medium">Platform Management Authority (PMA)</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setAnchoring(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <ShieldCheck size={18} className="text-blue-400" />
            <span>Daily Closure</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-3xl font-black text-slate-900">
              {s.label === 'Revenue' ? `KSh ${s.count.toLocaleString()}` : s.count}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center">
                  <TrendingUp className="mr-2 text-blue-500" size={18} /> Operation Stream
                </h3>
             </div>
             <div className="divide-y divide-slate-50">
               {trips.filter(t => t.status !== TripStatus.COMPLETED).map(trip => (
                 <div key={trip.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                     <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><MapPin size={20} /></div>
                     <div>
                       <p className="text-xs font-black text-slate-400">{trip.id}</p>
                       <p className="font-bold text-slate-900">{trip.vehicleId}</p>
                     </div>
                   </div>
                   {trip.status === TripStatus.READY && (
                     <button onClick={() => handleDispatch(trip.id)} className="text-xs font-black bg-blue-600 text-white px-4 py-2 rounded-xl">Dispatch</button>
                   )}
                   <div className="text-right">
                     <p className="text-sm font-black text-slate-900">KSh {trip.totalRevenue}</p>
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
              <Sparkles className="mr-2 text-blue-200" size={20} /> Operational Intel
            </h3>
            <div className="relative mb-4">
              <input 
                type="text" 
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Analyze fleet..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none placeholder:text-blue-200"
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
