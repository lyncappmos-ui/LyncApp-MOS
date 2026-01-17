
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Database, Activity, ShieldCheck, Wifi, Radio, Lock, SignalHigh } from 'lucide-react';
import { bus, MOSEvents } from './services/eventBus';
import { LyncMOS } from './services/MOSAPI';
import { isSupabaseConfigured } from './services/supabaseClient';
import { MOCK_DB } from './services/db';

const App: React.FC = () => {
  const [logs, setLogs] = useState<{timestamp: string, msg: string, type: 'info' | 'event' | 'error' | 'api'}[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const simInterval = useRef<number | null>(null);

  const addLog = (msg: string, type: 'info' | 'event' | 'error' | 'api' = 'info') => {
    setLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 100));
  };

  useEffect(() => {
    addLog("LyncApp MOS Hub initializing Source of Truth...", "info");
    
    bus.on(MOSEvents.TRIP_STARTED, (t) => addLog(`RELAY_OUT: [TRIP_STARTED] -> External Spoke Node. ID: ${t.id}`, "event"));
    bus.on(MOSEvents.TICKET_ISSUED, (t) => addLog(`RELAY_IN: [TICKET_ISSUED] <- Remote Terminal. KES ${t.amount}`, "api"));
    bus.on(MOSEvents.SYNC_REQUIRED, () => addLog(`SYSTEM: Broadcasting global state sync to cloud`, "info"));

    return () => { if (simInterval.current) clearInterval(simInterval.current); };
  }, []);

  const runSimulation = () => {
    if (isSimulating) {
      if (simInterval.current) clearInterval(simInterval.current);
      setIsSimulating(false);
      addLog("Traffic simulation terminated.", "info");
    } else {
      setIsSimulating(true);
      addLog("Injecting synthetic remote Terminal traffic...", "info");
      simInterval.current = window.setInterval(async () => {
        const randomTrip = MOCK_DB.trips[Math.floor(Math.random() * MOCK_DB.trips.length)];
        try {
          await LyncMOS.ticket(randomTrip.id, "2547" + Math.random().toString().slice(2, 10), 100);
        } catch (e) {
          const readyTrip = MOCK_DB.trips.find(t => t.status !== 'ACTIVE');
          if (readyTrip) await LyncMOS.dispatch(readyTrip.id);
        }
      }, 3500);
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
                <span>Headless Source of Truth</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <StatusBadge icon={Activity} label="Core Engine" value="ACTIVE" color="text-green-400" />
            <StatusBadge icon={SignalHigh} label="Bridge Relay" value="LISTENING" color="text-blue-400" />
            <StatusBadge icon={Database} label="Cloud Vault" value={isSupabaseConfigured ? 'CONNECTED' : 'LOCAL_MODE'} color="text-indigo-400" />
          </div>
        </div>
        <button 
          onClick={() => setShowDocs(!showDocs)}
          className={`px-5 py-2 rounded-lg border font-black text-[10px] uppercase tracking-widest transition-all ${
            showDocs ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          {showDocs ? 'View Live Monitor' : 'Architecture Guide'}
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Core Monitor - Now expanded to full width */}
        <section className="flex-1 flex flex-col bg-[#030816] relative">
          {showDocs ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4">
               <div className="space-y-4">
                 <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center">
                   <Lock size={24} className="mr-4 text-blue-500" /> Secure Terminal Interfacing
                 </h2>
                 <p className="text-slate-500 text-base max-w-2xl font-sans leading-relaxed">
                   The MOS Core functions as a Headless Authority. External Terminal Spokes connect via 
                   PostMessage Bridge (local) or Supabase Realtime (deployed). Direct database access 
                   from terminals is physically impossible by design.
                 </p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 <div className="space-y-4 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mr-3 text-[12px] font-black">01</div>
                      State Context
                    </h3>
                    <p className="text-xs text-slate-500 font-sans leading-relaxed mb-4">Terminals fetch session state from the Core's validated cache.</p>
                    <pre className="text-[10px] text-blue-400 bg-black/50 p-4 rounded-xl border border-slate-800/50">
                      {`const ctx = await LyncMOS.getTerminalContext(phone);`}
                    </pre>
                 </div>
                 <div className="space-y-4 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mr-3 text-[12px] font-black">02</div>
                      Atomic Commands
                    </h3>
                    <p className="text-xs text-slate-500 font-sans leading-relaxed mb-4">Operations are submitted as intents and validated by Core business rules.</p>
                    <pre className="text-[10px] text-indigo-400 bg-black/50 p-4 rounded-xl border border-slate-800/50">
                      {`await LyncMOS.ticket(tripId, paxPhone, amt);`}
                    </pre>
                 </div>
                 <div className="space-y-4 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
                      <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mr-3 text-[12px] font-black">03</div>
                      Event Relay
                    </h3>
                    <p className="text-xs text-slate-500 font-sans leading-relaxed mb-4">Core broadcasts internal changes to all active terminal listeners.</p>
                    <pre className="text-[10px] text-green-400 bg-black/50 p-4 rounded-xl border border-slate-800/50">
                      {`bus.on(MOSEvents.TRIP_STARTED, updateUI);`}
                    </pre>
                 </div>
               </div>
            </div>
          ) : (
            <>
              <div className="p-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center space-x-3 text-slate-500">
                  <Terminal size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Global Relay Monitor</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest border-r border-slate-800 pr-4">
                    Active Spokes: {isSimulating ? '3' : '0'}
                  </div>
                  <button onClick={runSimulation} className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${isSimulating ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'}`}>
                    {isSimulating ? 'Shutdown Traffic' : 'Simulate Spoke Activity'}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-2 bg-[#01040a]">
                 {logs.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
                        <Activity size={24} className="animate-pulse" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">System Standby</p>
                   </div>
                 ) : (
                   logs.map((log, i) => (
                      <div key={i} className="flex group font-mono text-[11px] py-1.5 border-l-2 border-transparent hover:border-blue-500/50 pl-4 transition-all animate-in fade-in slide-in-from-left-2">
                        <span className="text-slate-800 mr-6 tabular-nums w-24 tracking-tighter">[{log.timestamp}]</span>
                        <span className={`flex-1 ${log.type === 'event' ? 'text-green-500' : log.type === 'api' ? 'text-blue-400' : 'text-slate-500'}`}>
                          <span className="opacity-50 mr-2">>>></span> {log.msg}
                        </span>
                      </div>
                   ))
                 )}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Simplified Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800 px-8 py-4 flex items-center justify-between z-30 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
        <div className="flex items-center space-x-8">
          <div className="flex items-center"><Wifi size={12} className="mr-2 text-green-500" /> Operational Integrity Secured</div>
          <div className="text-blue-500/50">Node ID: MOS-ALPHA-RELAY-01</div>
        </div>
        <div className="flex items-center space-x-2">
          <ShieldCheck size={12} className="text-indigo-500" />
          <span>LyncApp MOS • Headless Domain Authority</span>
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
