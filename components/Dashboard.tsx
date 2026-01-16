
import React, { useState } from 'react';
// Added MapPin to the lucide-react imports
import { Plus, History, Calendar, Filter, ArrowUpRight, TrendingUp, ShieldCheck, Cpu, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MOCK_DB } from '../services/db';
import { TripStatus } from '../types';
import { MOSService } from '../services/mosService';

const Dashboard: React.FC = () => {
  const [trips, setTrips] = useState(MOCK_DB.trips);
  const [anchoring, setAnchoring] = useState(false);

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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

      {/* Tabs / Filter Row */}
      <div className="flex items-center space-x-8 border-b border-slate-200">
        {['Trip Management', 'Maintenance', 'Scheduled', 'Fleet', 'Historical'].map((tab, idx) => (
          <button key={tab} className={`pb-4 px-2 text-sm font-semibold transition-all ${idx === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
            {tab}
          </button>
        ))}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trip Management Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900">Live Trip Registry</h2>
              <div className="flex items-center space-x-2">
                 <button className="p-2 text-slate-400 hover:text-slate-600"><History size={20} /></button>
                 <button className="p-2 text-slate-400 hover:text-slate-600"><Filter size={20} /></button>
              </div>
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
                             <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><ArrowUpRight size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-center">
               <button className="text-xs font-bold text-blue-600 hover:underline">View Full Registry</button>
            </div>
          </div>
        </div>

        {/* Analytics & Trust Sidebar */}
        <div className="space-y-6">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center">
               <TrendingUp size={18} className="mr-2 text-blue-500" /> Hourly Load Trend
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="trips" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trust Scores */}
          <div className="bg-[#1e293b] text-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold mb-4 flex items-center justify-between">
               <span>Top Operator Trust</span>
               <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">Verified Ledger</span>
            </h3>
            <div className="space-y-4">
              {MOCK_DB.crews.map(crew => (
                <div key={crew.id} className="flex flex-col">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium opacity-80">{crew.name}</span>
                    <span className="text-xs font-bold text-blue-400">{crew.trustScore}% Score</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${crew.trustScore}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold tracking-wider transition-colors">
              VIEW INCENTIVE LEDGER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
