
import React, { useState } from 'react';
import { Plus, History, Calendar, Filter, ArrowUpRight, TrendingUp, ShieldCheck, Cpu, MapPin, Sparkles, Send, MessageCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MOCK_DB } from '../services/db';
import { TripStatus } from '../types';
import { MOSService } from '../services/mosService';
import { GoogleGenAI } from "@google/genai";

const Dashboard: React.FC = () => {
  const [trips, setTrips] = useState(MOCK_DB.trips);
  const [anchoring, setAnchoring] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const stats = [
    { label: 'Active', count: trips.filter(t => t.status === TripStatus.ACTIVE).length, color: 'bg-green-100 text-green-700', icon: '🟢' },
    { label: 'Ready', count: trips.filter(t => t.status === TripStatus.READY).length, color: 'bg-blue-100 text-blue-700', icon: '🔵' },
    { label: 'Delayed', count: trips.filter(t => t.status === TripStatus.DELAYED).length, color: 'bg-orange-100 text-orange-700', icon: '🟠' },
    { label: 'Scheduled', count: trips.filter(t => t.status === TripStatus.SCHEDULED).length, color: 'bg-slate-100 text-slate-700', icon: '⚪' },
  ];

  const chartData = [
    { name: '06:00 AM', trips: 12, revenue: 4500 },
    { name: '08:00 AM', trips: 18, revenue: 8200 },
    { name: '10:00 AM', trips: 15, revenue: 6400 },
    { name: '12:00 PM', trips: 22, revenue: 9800 },
    { name: '02:00 PM', trips: 19, revenue: 7500 },
    { name: '04:00 PM', trips: 25, revenue: 11200 },
    { name: '06:00 PM', trips: 20, revenue: 8900 },
  ];

  const handleStatusChange = async (tripId: string, status: TripStatus) => {
    const updated = await MOSService.updateTripStatus(tripId, status);
    setTrips([...MOCK_DB.trips]);
  };

  const handleAnchor = async () => {
    setAnchoring(true);
    await MOSService.performDailyClosure('s1');
    setTimeout(() => {
      setAnchoring(false);
      alert("Daily operation summary anchored to Celo Mainnet. Hash verified.");
    }, 2000);
  };

  const handleAskAi = async () => {
    if (!aiQuery) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const prompt = `
        You are an Operational Assistant for LyncApp MOS (Mobility Operating System).
        Current Sacco State:
        - Active Trips: ${trips.filter(t => t.status === TripStatus.ACTIVE).length}
        - Total Crew: ${MOCK_DB.crews.length}
        - Daily Revenue: KES ${trips.reduce((a, b) => a + b.totalRevenue, 0)}
        - Top Crew Member: ${MOCK_DB.crews.sort((a, b) => b.trustScore - a.trustScore)[0].name} (Score: ${MOCK_DB.crews.sort((a, b) => b.trustScore - a.trustScore)[0].trustScore}%)
        
        Question: ${aiQuery}
        Answer concisely as a professional transport manager.
      `;
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiResponse(result.text);
    } catch (err) {
      setAiResponse("I'm having trouble accessing my core brain right now. Please check operational logs.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">SACCO Dashboard</h1>
          <p className="text-slate-500 flex items-center mt-1">
            <MapPin size={14} className="mr-1" /> Super Metro - Nairobi CBD Hub
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleAnchor}
            disabled={anchoring}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all font-medium border border-slate-200"
          >
            {anchoring ? <Cpu size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
            <span>{anchoring ? 'Anchoring...' : 'Web3 Closure'}</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-500/30">
            <Plus size={20} />
            <span>Add New Trip</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.color}`}>
                {stat.label === 'Active' ? 'Live' : 'Queue'}
              </span>
            </div>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-black text-slate-900">{stat.count}</span>
              <span className="text-sm text-slate-400 mb-1.5 font-medium">trips</span>
            </div>
          </div>
        ))}
        <div className="bg-blue-600 p-6 rounded-2xl shadow-xl shadow-blue-500/20 text-white flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-80">
            <span className="text-sm font-bold uppercase tracking-wider">Revenue</span>
            <TrendingUp size={18} />
          </div>
          <div className="mt-2">
            <span className="text-sm font-medium">Est. KES</span>
            <div className="text-2xl font-black">126,500.00</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900">Live Trip Registry</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">ID / Route</th>
                    <th className="px-6 py-4">Vehicle / Driver</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {trips.map((trip) => {
                    const vehicle = MOCK_DB.vehicles.find(v => v.id === trip.vehicleId);
                    const driver = MOCK_DB.crews.find(c => c.id === trip.driverId);
                    const route = MOCK_DB.routes.find(r => r.id === trip.routeId);
                    
                    return (
                      <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 mb-1">{trip.id}</span>
                            <span className="text-sm font-bold text-slate-900">{route?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 flex items-center">
                               {vehicle?.plate} <span className="ml-2 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded">{vehicle?.type}</span>
                            </span>
                            <span className="text-xs text-slate-500 mt-0.5">{driver?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ring-1 ring-inset ${
                            trip.status === TripStatus.ACTIVE ? 'bg-green-50 text-green-700 ring-green-600/20' :
                            trip.status === TripStatus.READY ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                            trip.status === TripStatus.DELAYED ? 'bg-orange-50 text-orange-700 ring-orange-600/20' :
                            'bg-slate-50 text-slate-600 ring-slate-600/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              trip.status === TripStatus.ACTIVE ? 'bg-green-500' :
                              trip.status === TripStatus.READY ? 'bg-blue-500' :
                              trip.status === TripStatus.DELAYED ? 'bg-orange-500' :
                              'bg-slate-400'
                            }`} />
                            {trip.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                             {trip.status === TripStatus.READY && (
                               <button 
                                 onClick={() => handleStatusChange(trip.id, TripStatus.ACTIVE)}
                                 className="text-xs font-bold px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                               >
                                 Dispatch
                               </button>
                             )}
                             {trip.status === TripStatus.ACTIVE && (
                               <button 
                                 onClick={() => handleStatusChange(trip.id, TripStatus.COMPLETED)}
                                 className="text-xs font-bold px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
                               >
                                 Conclude
                               </button>
                             )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Assistant Card */}
          <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-xl overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Sparkles size={60} className="text-blue-600" />
             </div>
             <h3 className="font-black text-slate-900 mb-4 flex items-center">
               <MessageCircle size={18} className="mr-2 text-blue-600" /> AI Ops Assistant
             </h3>
             <p className="text-xs text-slate-500 mb-4 font-medium">Ask for operational optimizations or data summaries.</p>
             
             <div className="space-y-4">
               {aiResponse && (
                 <div className="p-4 bg-blue-50 rounded-xl text-xs text-blue-900 font-medium leading-relaxed animate-in slide-in-from-bottom-2">
                   {aiResponse}
                 </div>
               )}
               <div className="flex items-center space-x-2">
                 <input 
                   type="text" 
                   value={aiQuery}
                   onChange={(e) => setAiQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                   placeholder="e.g. How is Mike performing?" 
                   className="flex-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                 />
                 <button 
                   onClick={handleAskAi}
                   disabled={aiLoading}
                   className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                 >
                   {aiLoading ? <Cpu size={14} className="animate-spin" /> : <Send size={14} />}
                 </button>
               </div>
             </div>
          </div>

          <div className="bg-[#1e293b] text-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold mb-4 flex items-center justify-between">
               <span>Operator Trust</span>
               <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Verified</span>
            </h3>
            <div className="space-y-4">
              {MOCK_DB.crews.map(crew => (
                <div key={crew.id} className="flex flex-col">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium opacity-80">{crew.name}</span>
                    <span className="text-xs font-bold text-blue-400">{crew.trustScore}%</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all" style={{ width: `${crew.trustScore}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
