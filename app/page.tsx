
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Activity, ShieldCheck, Radio, SignalHigh, Globe, Key, RefreshCcw, Layers, Command } from 'lucide-react';
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
    addLog(`MOS Kernel V3.6 Stable Boot Sequence Initiated`, "info");
    addLog(`System Runtime: Node 24.x / Next.js 15.1`, "info");
    
    const statusInterval = setInterval(() => {
      setCoreState(runtime.getState());
    }, 2000);

    bus.on(MOSEvents.TRIP_STARTED, (t) => addLog(`SIGNAL: [TRIP_STARTED] - Fleet Trip ${t.id}`, "event"));
    bus.on(MOSEvents.TICKET_ISSUED, (t) => addLog(`LEDGER: [TICKET_ISSUED] - Revenue KES ${t.amount}`, "api"));
    
    bus.on(MOSEvents.HEALTH_CHECK, (data) => {
      setGateConnections(prev => [data, ...prev].slice(0, 8));
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
      addLog("Traffic simulation suspended.", "info");
    } else {
      setIsSimulating(true);
      addLog("Initiating high-throughput traffic simulation...", "info");
      simInterval.current = window.setInterval(async () => {
        const randomTrip = MOCK_DB.trips[Math.floor(Math.random() * MOCK_DB.trips.length)];
        try {
          const res = await LyncMOS.ticket(randomTrip.id, "2547" + Math.random().toString().slice(2, 10), 50);
          if (res.error) addLog(`SIM_FAULT: ${res.error.message}`, "error");
        } catch (e: any) {
          addLog(`RUNTIME_FAULT: ${e.message}`, "error");
        }
      }, 4000);
    }
  };

  const stateColor = coreState === CoreState.READY ? 'text-green-400' : 
                    coreState === CoreState.WARMING ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#020617] font-sans selection:bg-blue-500/30">
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 p-6 flex items-center justify-between z-30">
        <div className="flex items-center space-x-12">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Cpu className="text-blue-500" size={24} />
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tighter uppercase leading-none italic">LyncMOS Kernel</h1>
              <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                <Radio size={12} className={`${stateColor} animate-pulse`} />
                <span>KERNEL STATE: {coreState}</span>
              </div>
            </div>
          </div>
          <div className="hidden xl:flex space-x-6">
            <StatusBadge icon={Activity} label="Engine" value="Next.js 15.1" color="text-blue-400" />
            <StatusBadge icon={SignalHigh} label="Protocol" value="MOS_RPC_V3" color="text-indigo-400" />
            <StatusBadge icon={ShieldCheck} label="Security" value="NODE_24_V8" color="text-emerald-400" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={runSimulation} 
            className={`flex items-center space-x-3 text-[10px] font-black uppercase px-6 py-3 rounded-2xl border transition-all active:scale-95 ${isSimulating ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}
          >
            <RefreshCcw size={14} className={isSimulating ? 'animate-spin' : ''} />
            <span>{isSimulating ? 'Suspend Stream' : 'Launch Simulation'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-[380px] bg-slate-900/40 border-r border-slate-800 flex flex-col hidden lg:flex">
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                  <Globe size={16} className="mr-3 text-indigo-500" /> Active Edge Gateways
               </h3>
               <span className="text-[10px] font-mono text-slate-700">{gateConnections.length} live</span>
             </div>
             <div className="space-y-4">
                {gateConnections.length === 0 && (
                  <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                    <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Awaiting Gateway Traffic...</p>
                  </div>
                )}
                {gateConnections.map((conn, i) => (
                    <div key={i} className={`p-5 rounded-[2rem] border transition-all animate-in slide-in-from-left-4 ${
                      conn.status === 'SUCCESS' ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500' : 'bg-red-900/10 border-red-900/20'
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-black text-white truncate w-32">{conn.consumer}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${conn.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {conn.status}
                        </span>
                      </div>
                      <div className="flex items-center text-[10px] text-slate-500 font-mono">
                        <Key size={12} className="mr-2 text-blue-500" /> {conn.method}
                      </div>
                    </div>
                ))}
             </div>
          </div>
          <div className="p-8 border-t border-slate-800 bg-slate-900/20">
             <div className="flex items-center space-x-3 mb-4">
               <Command size={14} className="text-slate-500" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kernel Stats</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                 <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Queue</p>
                 <p className="text-sm font-black text-white">0.02ms</p>
               </div>
               <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                 <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Load</p>
                 <p className="text-sm font-black text-white">4%</p>
               </div>
             </div>
          </div>
        </aside>

        <section className="flex-1 flex flex-col bg-[#01040a] relative">
          <div className="p-8 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/10 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center space-x-4 text-slate-500">
              <Terminal size={18} className="text-blue-500" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white">Kernel Command stream</span>
            </div>
            <div className="flex items-center space-x-8">
               <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-bold">
                  <Layers size={14} className="text-slate-700" />
                  <span className="font-mono">V3.6.0_CANONICAL</span>
               </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-3 font-mono text-[12px] leading-relaxed">
             {logs.length === 0 && (
               <div className="flex items-center space-x-2 text-slate-800 animate-pulse">
                 <span>{">"}</span>
                 <span className="w-2 h-4 bg-slate-800"></span>
               </div>
             )}
             {logs.map((log, i) => (
                <div key={i} className="flex group py-1 hover:bg-slate-900/20 pl-4 border-l-2 border-slate-900 hover:border-blue-500/50 transition-all animate-in fade-in slide-in-from-top-1">
                  <span className="text-slate-800 mr-6 tabular-nums select-none opacity-50">[{log.timestamp}]</span>
                  <span className={`flex-1 ${
                    log.type === 'security' ? 'text-amber-500 font-bold' : 
                    log.type === 'event' ? 'text-emerald-500' : 
                    log.type === 'api' ? 'text-blue-400 font-medium' : 
                    log.type === 'error' ? 'text-rose-500 font-black' : 'text-slate-600'
                  }`}>
                    {log.msg}
                  </span>
                </div>
             ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const StatusBadge = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center space-x-3 px-5 py-2.5 bg-slate-800/30 rounded-2xl border border-slate-700/30 text-[10px] font-black uppercase tracking-wider">
    <Icon size={14} className={color} />
    <span className="text-slate-500/80">{label}:</span>
    <span className={color}>{value}</span>
  </div>
);
