
"use client";

import React, { useState, useEffect } from 'react';
import { Smartphone, Ticket, ShieldCheck, Wifi, CreditCard, RefreshCw, Lock, Zap, Cloud } from 'lucide-react';
import { bus, MOSEvents } from '../services/eventBus';
import { LyncMOS } from '../services/MOSAPI';
import { CrewMember, Trip, Route } from '../types';

const TerminalSimulator: React.FC = () => {
  const [operator, setOperator] = useState<CrewMember | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketStatus, setTicketStatus] = useState<'idle' | 'success'>('idle');
  const [bridgeStatus, setBridgeStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');

  const syncWithHub = async () => {
    try {
      const response = await LyncMOS.getTerminalContext("254700000004");

      /**
       * CANONICAL NARROWING:
       * 1. Check for response validity.
       * 2. Narrow data to non-null scope.
       * 3. Assign properties safely using the refined TerminalContext structure.
       */
      if (response.data === null) {
        setBridgeStatus('DISCONNECTED');
        return;
      }

      const terminalData = response.data;

      // Type-safe assignment for nullable properties
      setOperator(terminalData.operator);
      setActiveTrip(terminalData.activeTrip);
      setRoute(terminalData.route);
      setBridgeStatus('CONNECTED');
    } catch (e) {
      console.error("Hub Sync Error", e);
      setBridgeStatus('CONNECTING');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncWithHub();

    const handleRemoteSignal = () => syncWithHub();
    
    bus.on(MOSEvents.TRIP_STARTED, handleRemoteSignal);
    bus.on(MOSEvents.TRIP_COMPLETED, handleRemoteSignal);
    bus.on(MOSEvents.SYNC_REQUIRED, handleRemoteSignal);

    return () => {
      bus.off(MOSEvents.TRIP_STARTED, handleRemoteSignal);
      bus.off(MOSEvents.TRIP_COMPLETED, handleRemoteSignal);
      bus.off(MOSEvents.SYNC_REQUIRED, handleRemoteSignal);
    };
  }, []);

  const handleIssueTicket = async (amount: number) => {
    if (!activeTrip) return;
    try {
      await LyncMOS.ticket(activeTrip.id, "2547" + Math.random().toString().slice(2,10), amount);
      setTicketStatus('success');
      setTimeout(() => setTicketStatus('idle'), 2000);
      syncWithHub(); 
    } catch (e) {
      alert("Relay denied ticket issuance.");
    }
  };

  if (loading) return (
    <div className="w-full h-full bg-[#0f172a] rounded-[3rem] flex items-center justify-center border-[8px] border-slate-800">
      <RefreshCw className="text-blue-500 animate-spin" size={32} />
    </div>
  );

  return (
    <div className="w-full h-full bg-[#0f172a] rounded-[3rem] border-[8px] border-slate-800 relative overflow-hidden flex flex-col shadow-2xl">
      {/* Device Status Bar */}
      <div className="h-10 bg-black flex items-center justify-between px-8 text-[10px] font-black text-slate-600">
        <div className="flex items-center space-x-2">
          <span>9:41</span>
          <Wifi size={10} className={bridgeStatus === 'CONNECTED' ? 'text-green-500' : 'text-slate-800'} />
        </div>
        <div className="flex items-center space-x-1">
          <Zap size={10} className="text-yellow-500" />
          <span>88%</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Profile Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white shadow-lg">
              {operator?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">{operator?.name || 'Unknown Operator'}</h2>
              <div className="flex items-center text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                <ShieldCheck size={10} className="mr-1" /> Trust: {operator?.trustScore ?? 0}%
              </div>
            </div>
          </div>
          <div className="p-2 bg-slate-800 rounded-xl text-slate-500">
            <Cloud size={16} className={bridgeStatus === 'CONNECTED' ? 'text-blue-500' : ''} />
          </div>
        </div>

        {activeTrip ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Trip Context Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Smartphone size={80} /></div>
               <p className="text-[10px] font-black uppercase opacity-60 mb-1 tracking-widest">Live Assignment</p>
               <h3 className="text-xl font-black mb-4">
                 {route?.code || 'GEN'} • {activeTrip.vehicleId}
               </h3>
               <div className="flex items-center justify-between border-t border-white/10 pt-4">
                 <div><p className="text-[9px] uppercase opacity-50">Hub Revenue</p><p className="font-black tabular-nums">KSh {activeTrip.totalRevenue}</p></div>
                 <div><p className="text-[9px] uppercase opacity-50">Tickets</p><p className="font-black tabular-nums">{activeTrip.ticketCount}</p></div>
               </div>
            </div>

            {/* Fare Pad */}
            <div className="grid grid-cols-2 gap-4">
              {[50, 100, 150, 200].map(amt => (
                <button 
                  key={amt} 
                  onClick={() => handleIssueTicket(amt)} 
                  className="py-6 bg-slate-800/50 border-2 border-slate-700/50 rounded-3xl text-white hover:border-blue-500 active:scale-95 transition-all flex flex-col items-center group"
                >
                  <CreditCard size={20} className="mb-2 opacity-30 group-hover:opacity-100 transition-opacity" />
                  <span className="text-lg font-black">{amt}</span>
                  <span className="text-[8px] uppercase font-bold opacity-30">KES</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-800/30 rounded-full flex items-center justify-center border border-slate-700/50 relative">
               <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full"></div>
               <Lock size={32} className="text-slate-700 relative" />
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-black text-lg uppercase tracking-tight">Assignment Pending</h3>
              <p className="text-[10px] text-slate-500 max-w-[180px] mx-auto leading-relaxed">
                The Hub is currently coordinating your fleet. Stand by for a remote dispatch signal.
              </p>
            </div>
          </div>
        )}
      </div>

      {ticketStatus === 'success' && (
        <div className="absolute top-14 left-6 right-6 bg-green-600 text-white p-4 rounded-2xl shadow-2xl flex items-center animate-in slide-in-from-top-8 z-50">
          <ShieldCheck size={20} className="mr-3 shrink-0" />
          <div className="text-xs font-bold leading-tight">
            <p className="uppercase text-[10px]">Signal Anchored</p>
            <p className="opacity-80">Hub accepted revenue packet</p>
          </div>
        </div>
      )}

      {/* Home Indicator */}
      <div className="h-10 bg-black flex items-center justify-center"><div className="w-24 h-1.5 bg-slate-800 rounded-full"></div></div>
    </div>
  );
};

export default TerminalSimulator;
