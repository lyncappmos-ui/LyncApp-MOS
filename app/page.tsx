
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Activity, ShieldCheck, Radio, SignalHigh, Globe, Key, RefreshCcw, BookOpen, Layers } from 'lucide-react';
import { bus, MOSEvents } from '@/services/eventBus';
import { LyncMOS } from '@/services/MOSAPI';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/core/coreRuntime';
import { CoreState } from '@/types';

export default function Home() {
  const [logs, setLogs] = useState<{timestamp: string, msg: string, type: 'info' | 'event' | 'error' | 'api' | 'security'}[]>([]);
  const [gateConnections, setGateConnections] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [coreState, setCoreState] = useState<CoreState>(runtime.getState());
  const simInterval = useRef<number | null>(null);

  const addLog = (msg: string, type: 'info' | 'event' | 'error' | 'api' | 'security' = 'info') => {
    setLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 100));
  };

  useEffect(() => {
    addLog(`MOS Core Runtime: Next.js App Router v2.6.0-next`, "info");
    
    const statusInterval = setInterval(() => {
      setCoreState(runtime.getState());
    }, 2000);

    bus.on(MOSEvents.TRIP_STARTED, (t) => addLog(`EVENT: [TRIP_STARTED] - Trip ${t.id}`, "event"));
    bus.on(MOSEvents.TICKET_ISSUED, (t) => addLog(`REVENUE: [TICKET_ISSUED] - KES ${t.amount}`, "api"));
    
    bus.on(MOSEvents.HEALTH_CHECK, (data) => {
      setGateConnections(prev => [data, ...prev].slice(0, 5));
      const logType = data.status === 'SUCCESS' ? 'api' : 'security';
      addLog(`GATEWAY: ${data.consumer} -> ${data.method} [${data.status}]`, logType);
    });

    return () => { 
      if (simInterval.current) clearInterval(simInterval.current); 
      clearInterval(statusInterval);
    };
  }, []);

  const runSimulation = () => {
    if (isSimulating) {
      if (simInterval.current) clearInterval(simInterval.current);
      setIsSimulating(false);
      addLog("Traffic simulation terminated.", "info");
    } else {
      setIsSimulating(true);
      addLog("Starting High-Integrity Traffic simulation...", "info");
      simInterval.current = window.setInterval(async () => {
        const randomTrip = MOCK_DB.trips[Math.floor(Math.random() * MOCK_DB.trips.length)];
        try {
          const res = await LyncMOS.ticket(randomTrip.id, "2547" + Math.random().toString().slice(2, 10), 100);
          if (res.error) addLog(`SIM_ERROR: ${res.error.message}`, "error");
        } catch (e: any) {
          addLog(`SIM_EXCEPTION: ${e.message}`, "error");
        }
      }, 5000);
    }
  };

  const stateColor = coreState === CoreState.READY ? 'text-green-400' : 
                    coreState === CoreState.WARMING ? 'text-yellow-400' : 'text-red-400';

  const endpoints = [
    { path: '/api/health', method: 'GET', desc: 'Core heartbeat and runtime metadata' },
    { path: '/api/branches', method: 'GET', desc: 'Regional branch registry' },
    { path: '/api/crew', method: 'GET', desc: 'Operator reputation data' },
    { path: '/api/fleet', method: 'GET', desc: 'Global vehicle asset registry' },
    { path: '/api/trips', method: 'GET/POST', desc: 'Operational trip management' },
    { path: '/api/sms', method: 'GET', desc: 'Network communication metrics' },
    { path: '/api/settings', method: 'GET', desc: 'Core Sacco identity settings' },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#020617]">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-5 flex items-center justify-between z-30">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <Cpu className="text-blue-500" size={24} />
            <div>
              <h1 className="text-white font-black text-sm tracking-tighter uppercase leading-none">MOS-CORE-HUB</h1>
              <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                <Radio size={10} className={`${stateColor} animate-pulse`} />
                <span>Status: {coreState}</span>
              </div>
            </div>
          </div>
          <div className="hidden xl:flex space-x-3">
            <StatusBadge icon={Activity} label="Runtime" value="NEXTJS_15" color="text-blue-400" />
            <StatusBadge icon={SignalHigh} label="Protocol" value="MOS_RPC_V4" color="text-indigo-400" />
            <StatusBadge icon={ShieldCheck} label="Integrity" value="C-BREAKER_ENABLED" color="text-emerald-400" />
          </div>
        </div>
        <button 
          onClick={runSimulation} 
          className={`text-[9px] font-black uppercase px-6 py-2.5 rounded-xl border transition-all ${isSimulating ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]'}`}
        >
          {isSimulating ? 'Terminate Traffic' : 'Initiate Traffic Simulation'}
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-[340px] bg-slate-900/40 border-r border-slate-800 flex flex-col hidden lg:flex">
          <div className="p-6 border-b border-slate-800">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center mb-6">
                <BookOpen size={14} className="mr-2 text-blue-500" /> System Endpoints
             </h3>
             <div className="space-y-3">
                {endpoints.map((ep, i) => (
                  <div key={i} className="group p-4 rounded-2xl border border-slate-800 hover:border-blue-500/30 bg-slate-900/50 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1.5">
                      <code className="text-[11px] text-blue-400 font-bold tracking-tight">{ep.path}</code>
                      <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">{ep.method}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{ep.desc}</p>
                  </div>
                ))}
             </div>
          </div>
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center mb-6">
                <Globe size={14} className="mr-2 text-indigo-500" /> Platform Intercepts
             </h3>
             <div className="space-y-4">
                {gateConnections.map((conn, i) => (
                    <div key={i} className={`p-4 rounded-2xl border transition-all ${
                      conn.status === 'SUCCESS' ? 'bg-slate-800/50 border-slate-700' : 'bg-red-900/10 border-red-900/20'
                    }`}>
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">{conn.consumer}</span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${conn.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {conn.status}
                        </span>
                      </div>
                      <div className="flex items-center text-[10px] text-slate-500 font-mono">
                        <Key size={10} className="mr-2 text-blue-500" /> {conn.method}
                      </div>
                    </div>
                ))}
                {gateConnections.length === 0 && (
                  <div className="p-12 text-center text-slate-600 italic text-[10px] space-y-3">
                    <RefreshCcw className="mx-auto text-slate-700 opacity-20" size={24} />
                    <p>No platform signals detected</p>
                  </div>
                )}
             </div>
          </div>
        </aside>

        {/* Real-time Console */}
        <section className="flex-1 flex flex-col bg-[#01040a] relative">
          <div className="p-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/10 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center space-x-3 text-slate-500">
              <Terminal size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">System Kernel Logs</span>
            </div>
            <div className="flex items-center space-x-6">
               <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold">
                  <Layers size={12} className="text-slate-700" />
                  <span>BUILD_ID: VERCEL_STABLE_NEXT_APP</span>
               </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-1 font-mono text-[11px] leading-relaxed">
             {logs.map((log, i) => (
                <div key={i} className="flex group py-0.5 hover:bg-slate-900/20 pl-4 border-l border-slate-900 hover:border-blue-500/50 transition-all cursor-default">
                  <span className="text-slate-800 mr-5 tabular-nums select-none">[{log.timestamp}]</span>
                  <span className={`flex-1 ${
                    log.type === 'security' ? 'text-amber-500 font-bold' : 
                    log.type === 'event' ? 'text-emerald-500' : 
                    log.type === 'api' ? 'text-blue-400' : 
                    log.type === 'error' ? 'text-rose-500 font-black' : 'text-slate-600'
                  }`}>
                    {log.msg}
                  </span>
                </div>
             ))}
             {logs.length === 0 && (
               <div className="h-full flex items-center justify-center flex-col space-y-6 opacity-30 grayscale">
                  <RefreshCcw className="animate-spin text-blue-500" size={40} />
                  <div className="text-center">
                    <span className="uppercase tracking-[0.3em] text-[10px] font-black block">Connecting Hub</span>
                    <span className="text-[9px] mt-1 block">Awaiting operational heartbeats...</span>
                  </div>
               </div>
             )}
          </div>
        </section>
      </main>
    </div>
  );
}

const StatusBadge = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center space-x-2.5 px-4 py-2 bg-slate-800/30 rounded-2xl border border-slate-700/30 text-[9px] font-black uppercase tracking-wider">
    <Icon size={12} className={color} />
    <span className="text-slate-500/80">{label}:</span>
    <span className={color}>{value}</span>
  </div>
);
