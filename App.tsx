
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Database, Activity, ShieldCheck, Wifi, Radio, Lock, SignalHigh, Globe, Key, AlertCircle } from 'lucide-react';
import { bus, MOSEvents } from './services/eventBus';
import { LyncMOS } from './services/MOSAPI';
import { isSupabaseConfigured } from './services/supabaseClient';
import { MOCK_DB } from './services/db';

const App: React.FC = () => {
  const [logs, setLogs] = useState<{timestamp: string, msg: string, type: 'info' | 'event' | 'error' | 'api' | 'security'}[]>([]);
  const [gateConnections, setGateConnections] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const simInterval = useRef<number | null>(null);

  const addLog = (msg: string, type: 'info' | 'event' | 'error' | 'api' | 'security' = 'info') => {
    setLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 100));
  };

  useEffect(() => {
    addLog("LyncApp MOS Hub: System initialized.", "info");
    addLog("Gateway: Platform Access Keys V4 loaded.", "security");
    
    bus.on(MOSEvents.TRIP_STARTED, (t) => addLog(`CORE_DOMAIN: [TRIP_STARTED] - Trip ${t.id}`, "event"));
    bus.on(MOSEvents.TICKET_ISSUED, (t) => addLog(`CORE_DOMAIN: [TICKET_ISSUED] - Revenue Packet: ${t.amount}`, "api"));
    
    bus.on(MOSEvents.HEALTH_CHECK, (data) => {
      setGateConnections(prev => [data, ...prev].slice(0, 5));
      const logType = data.status === 'SUCCESS' ? 'api' : 'security';
      addLog(`GATEWAY: ${data.consumer} -> ${data.method} [${data.status}] ${data.latency || ''}`, logType);
    });

    return () => { if (simInterval.current) clearInterval(simInterval.current); };
  }, []);

  const runSimulation = () => {
    if (isSimulating) {
      if (simInterval.current) clearInterval(simInterval.current);
      setIsSimulating(false);
      addLog("Traffic simulation terminated.", "info");
    } else {
      setIsSimulating(true);
      addLog("Starting Platform RPC simulation...", "info");
      simInterval.current = window.setInterval(async () => {
        const randomTrip = MOCK_DB.trips[Math.floor(Math.random() * MOCK_DB.trips.length)];
        try {
          // Operational Edge (No Platform Key required for local device logic)
          await LyncMOS.ticket(randomTrip.id, "2547" + Math.random().toString().slice(2, 10), 100);
        } catch (e) {
          const readyTrip = MOCK_DB.trips.find(t => t.status !== 'ACTIVE');
          if (readyTrip) {
            // FIX: Correct argument order for dispatch (platformKey, tripId)
            await LyncMOS.dispatch('mos_pk_admin_global_7734', readyTrip.id);
          }
        }

        // Mocking a Control Tower connection via postMessage (Remote Logic)
        window.postMessage({
          protocol: 'LYNC_RPC_V1',
          method: 'getPlatformMetrics',
          platformKey: 'mos_pk_control_live_8291',
          requestId: Math.random().toString(36).substring(7)
        }, window.location.origin);
      }, 5000);
    }
  };

  return (
    <div className="h-screen bg-[#020617] text-slate-400 font-mono flex flex-col overflow-hidden selection:bg-blue-500/30">
      {/* HUB Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-5 flex items-center justify-between z-30">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <Cpu className="text-blue-500" size={24} />
            <div>
              <h1 className="text-white font-black text-sm tracking-tighter uppercase leading-none">MOS-CORE-ALPHA</h1>
              <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                <Radio size={10} className="text-green-500 animate-pulse" />
                <span>Production Gateway Online</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <StatusBadge icon={Activity} label="Domain Engine" value="STABLE" color="text-green-400" />
            <StatusBadge icon={SignalHigh} label="RPC Protocol" value="LYNC_RPC_V1" color="text-blue-400" />
            <StatusBadge icon={ShieldCheck} label="Auth Layer" value="KEY_AUTH" color="text-indigo-400" />
          </div>
        </div>
        <button 
          onClick={() => setShowDocs(!showDocs)}
          className={`px-5 py-2 rounded-lg border font-black text-[10px] uppercase tracking-widest transition-all ${
            showDocs ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          {showDocs ? 'View Live Monitor' : 'Gateway Architecture'}
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Core Monitor */}
        <section className="flex-1 flex flex-col bg-[#030816] relative border-r border-slate-800">
          <div className="p-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center space-x-3 text-slate-500">
              <Terminal size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Domain Operations log</span>
            </div>
            <button onClick={runSimulation} className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${isSimulating ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
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
                    log.type === 'api' ? 'text-blue-400' : 'text-slate-500'
                  }`}>
                    {log.msg}
                  </span>
                </div>
             ))}
          </div>
        </section>

        {/* Platform Gateway Panel */}
        <aside className="w-[400px] bg-slate-900/50 flex flex-col">
          <div className="p-6 border-b border-slate-800">
             <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center mb-6">
                <Globe size={14} className="mr-2 text-blue-500" /> Platform Connections
             </h3>
             
             <div className="space-y-4">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Authorized Channels</h4>
                {gateConnections.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                     <p className="text-[9px] text-slate-600 font-black">WAITING FOR PLATFORM KEYS...</p>
                  </div>
                ) : (
                  gateConnections.map((conn, i) => (
                    <div key={i} className={`p-4 rounded-2xl border transition-all animate-in slide-in-from-right-4 ${
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
                         {conn.latency && <span className="text-[9px] text-blue-500 font-bold">{conn.latency}</span>}
                      </div>
                      {conn.error && (
                        <div className="mt-2 p-2 bg-red-900/20 rounded-lg text-[9px] text-red-400 flex items-start space-x-2">
                           <AlertCircle size={10} className="mt-0.5" />
                           <span>{conn.error}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
             </div>
          </div>
          
          <div className="p-6 mt-auto border-t border-slate-800 bg-black/20">
             <div className="p-4 rounded-2xl bg-indigo-900/10 border border-indigo-900/20">
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2 flex items-center">
                  <ShieldCheck size={12} className="mr-2" /> Gateway Hardening
                </p>
                <p className="text-[9px] text-slate-500 leading-relaxed">
                  Platform RPC protocol (LYNC_RPC_V1) enforces domain isolation and anonymizes PII on the transport layer.
                </p>
             </div>
          </div>
        </aside>
      </main>

      <footer className="bg-slate-900/80 border-t border-slate-800 px-8 py-4 flex items-center justify-between z-30 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
        <div className="flex items-center space-x-8">
          <div className="flex items-center"><Wifi size={12} className="mr-2 text-green-500" /> Operational Authority Online</div>
          <div className="text-blue-500/50">Node: MOS-CORE-GATEWAY-01</div>
        </div>
        <div className="flex items-center space-x-2">
          <Lock size={12} className="text-indigo-500" />
          <span>LyncApp MOS • Platform Integrity Layer</span>
        </div>
      </footer>
    </div>
  );
};

const StatusBadge = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800/40 rounded-xl border border-slate-700/30 text-[9px] font-black uppercase tracking-wider">
    <Icon size={12} className={color} />
    <span className="text-slate-500/80">{label}:</span>
    <span className={color}>{value}</span>
  </div>
);

export default App;
