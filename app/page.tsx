
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Activity, ShieldCheck, Radio, Lock, SignalHigh, Globe, Key, AlertCircle, RefreshCcw } from 'lucide-react';
import { bus, MOSEvents } from '@/services/eventBus';
import { LyncMOS } from '@/services/MOSAPI';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/services/coreRuntime';
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
    addLog(`MOS Core Status: ${runtime.getState()}`, "info");
    
    const statusInterval = setInterval(() => {
      setCoreState(runtime.getState());
    }, 1000);

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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-5 flex items-center justify-between z-30">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <Cpu className="text-blue-500" size={24} />
            <div>
              <h1 className="text-white font-black text-sm tracking-tighter uppercase leading-none">MOS-CORE-V2</h1>
              <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                <Radio size={10} className={`${stateColor} animate-pulse`} />
                <span>Core State: {coreState}</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex space-x-3">
            <StatusBadge icon={Activity} label="Engine" value={coreState} color={stateColor} />
            <StatusBadge icon={SignalHigh} label="Protocol" value="CORE_RPC_V2" color="text-blue-400" />
            <StatusBadge icon={ShieldCheck} label="Security" value="ISOLATED" color="text-indigo-400" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <section className="flex-1 flex flex-col bg-[#030816] relative border-r border-slate-800">
          <div className="p-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center space-x-3 text-slate-500">
              <Terminal size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">System runtime Logs</span>
            </div>
            <button 
              onClick={runSimulation} 
              className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${isSimulating ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}
            >
              {isSimulating ? 'Stop Traffic' : 'Start Simulation'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-2 bg-[#01040a]">
             {logs.map((log, i) => (
                <div key={i} className="flex group font-mono text-[11px] py-1.5 border-l-2 border-transparent hover:border-blue-500/50 pl-4 transition-all">
                  <span className="text-slate-800 mr-6 tabular-nums w-24">[{log.timestamp}]</span>
                  <span className={`flex-1 ${
                    log.type === 'security' ? 'text-amber-500 font-bold' : 
                    log.type === 'event' ? 'text-green-500' : 
                    log.type === 'api' ? 'text-blue-400' : 
                    log.type === 'error' ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {log.msg}
                  </span>
                </div>
             ))}
          </div>
        </section>

        <aside className="hidden lg:flex w-[400px] bg-slate-900/50 flex-col border-l border-slate-800">
          <div className="p-6 border-b border-slate-800">
             <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center mb-6">
                <Globe size={14} className="mr-2 text-blue-500" /> Platform Intercepts
             </h3>
             <div className="space-y-4">
                {gateConnections.map((conn, i) => (
                    <div key={i} className={`p-4 rounded-2xl border transition-all ${
                      conn.status === 'SUCCESS' ? 'bg-slate-800/50 border-slate-700' : 'bg-red-900/10 border-red-900/20'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-white">{conn.consumer}</span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${conn.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {conn.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center text-[10px] text-slate-500 font-mono">
                           <Key size={10} className="mr-2" /> {conn.method}
                         </div>
                      </div>
                    </div>
                ))}
                {gateConnections.length === 0 && (
                  <div className="p-12 text-center text-slate-600 italic text-xs">
                    No active connections
                  </div>
                )}
             </div>
          </div>
          <div className="p-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center mb-6">
              <Activity size={14} className="mr-2 text-indigo-500" /> API Endpoints
            </h3>
            <div className="space-y-2">
              {['health', 'branches', 'crew', 'fleet', 'vehicles', 'sms', 'settings', 'trips'].map(endpoint => (
                <div key={endpoint} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-[10px] flex items-center justify-between">
                  <code className="text-blue-400">/api/{endpoint}</code>
                  <span className="text-green-500 font-bold uppercase">Active</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

const StatusBadge = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800/40 rounded-xl border border-slate-700/30 text-[9px] font-black uppercase tracking-wider">
    <Icon size={12} className={color} />
    <span className="text-slate-500/80">{label}:</span>
    <span className={color}>{value}</span>
  </div>
);
