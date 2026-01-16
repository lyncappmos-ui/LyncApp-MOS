
import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Database, Activity, ShieldCheck, Wifi, Code2, Zap } from 'lucide-react';
import { bus, MOSEvents } from './services/eventBus';
import { LyncMOS } from './services/MOSAPI';
import { isSupabaseConfigured } from './services/supabaseClient';

const App: React.FC = () => {
  const [logs, setLogs] = useState<{timestamp: string, msg: string, type: 'info' | 'event' | 'error' | 'api'}[]>([]);
  const [status, setStatus] = useState({
    core: 'BOOTING',
    api: 'READY',
    db: isSupabaseConfigured ? 'CONNECTED' : 'MOCK_MODE',
    integrity: 'ACTIVE'
  });

  const addLog = (msg: string, type: 'info' | 'event' | 'error' | 'api' = 'info') => {
    setLogs(prev => [
      { timestamp: new Date().toLocaleTimeString(), msg, type },
      ...prev
    ].slice(0, 50));
  };

  useEffect(() => {
    addLog("LyncApp MOS Core Engine Initializing...", "info");
    
    // Intercept API calls for the monitor
    const originalDispatch = LyncMOS.dispatch;
    LyncMOS.dispatch = async (id: string) => {
      addLog(`API_CALL: LyncMOS.dispatch("${id}")`, "api");
      return originalDispatch(id);
    };

    // Listen to Domain Events
    bus.on(MOSEvents.TRIP_STARTED, (t) => addLog(`EVENT: ${MOSEvents.TRIP_STARTED} - Trip ${t.id} is now ACTIVE`, "event"));
    bus.on(MOSEvents.TICKET_ISSUED, (t) => addLog(`EVENT: ${MOSEvents.TICKET_ISSUED} - KES ${t.amount} recorded for ${t.tripId}`, "event"));
    bus.on(MOSEvents.SYNC_REQUIRED, (d) => addLog(`SYSTEM: State Sync Triggered (${d.type || 'Generic'})`, "info"));

    setStatus(s => ({ ...s, core: 'RUNNING' }));
    addLog("Headless Engine Online. Public API: window.LyncMOS", "info");

    return () => {
      // Restore or clean up if necessary
    };
  }, []);

  return (
    <div className="h-screen bg-[#020617] text-slate-300 font-mono flex flex-col overflow-hidden">
      {/* Header / StatusBar */}
      <div className="bg-slate-900/50 border-b border-slate-800 p-6 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Cpu className="text-blue-500 animate-pulse" size={24} />
            </div>
            <div>
              <h1 className="text-white font-black tracking-tight">LYNC-MOS CORE</h1>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">v2.5.0 Headless Instance</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 mx-2"></div>

          <div className="flex space-x-4">
            <StatusBadge icon={Activity} label="Core" value={status.core} color="text-green-400" />
            <StatusBadge icon={Code2} label="API" value={status.api} color="text-blue-400" />
            <StatusBadge icon={Database} label="DB" value={status.db} color="text-indigo-400" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right mr-4">
             <span className="text-[10px] block text-slate-500 font-bold uppercase mb-1 text-right">Integrity Layer</span>
             <span className="text-xs font-black text-white px-2 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded flex items-center">
               <ShieldCheck size={12} className="mr-1.5 text-indigo-400" /> CELO_MAINNET
             </span>
          </div>
          <div className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors">
            <Zap size={20} />
          </div>
        </div>
      </div>

      {/* Main Terminal Area */}
      <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center space-x-2 text-slate-500">
             <Terminal size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">System Operational Logs</span>
           </div>
           <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-500">
             <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div> API CALL</span>
             <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> DOMAIN EVENT</span>
             <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-500 mr-2"></div> INFO</span>
           </div>
        </div>

        <div className="flex-1 bg-black/40 border border-slate-800 rounded-xl p-6 overflow-y-auto custom-scrollbar font-mono text-[13px] leading-relaxed shadow-inner">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 italic">
              Awaiting operational triggers...
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="flex group">
                  <span className="text-slate-600 mr-4 opacity-50 tabular-nums">[{log.timestamp}]</span>
                  <span className={`
                    ${log.type === 'api' ? 'text-blue-400' : 
                      log.type === 'event' ? 'text-green-400' : 
                      log.type === 'error' ? 'text-red-400' : 'text-slate-400'}
                  `}>
                    <span className="mr-2 opacity-30 group-hover:opacity-100 transition-opacity">#</span>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer / API Helper */}
      <div className="bg-slate-900/30 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <Wifi size={12} className="mr-2 text-green-500" /> Socket.IO/EventBus Stream Active
          </div>
          <div className="flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
             Origin: <span className="text-blue-400 ml-2">Local/Cloud Composite</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-bold">
          © 2026 LYNCAPP MOBILITY OPERATING SYSTEM • HEADLESS BUILD
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center space-x-2 px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-800">
    <Icon size={12} className={color} />
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}:</span>
    <span className={`text-[10px] font-black uppercase ${color}`}>{value}</span>
  </div>
);

export default App;
