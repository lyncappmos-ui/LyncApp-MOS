
import React, { useState } from 'react';
import { Database, CloudUpload, Terminal, CheckCircle2, AlertTriangle, Copy, RefreshCcw } from 'lucide-react';
import { MOSService } from '../services/mosService';
import { isSupabaseConfigured, PROJECT_ID } from '../services/supabaseClient';

const SystemSetup: React.FC = () => {
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleProvision = async () => {
    if (!isSupabaseConfigured) {
      alert("Missing Supabase API keys (SUPABASE_ANON_KEY). Please configure your environment variables.");
      return;
    }
    
    if (!window.confirm("This will upload all local mock data to your live Supabase project. Are you ready?")) return;
    
    setIsProvisioning(true);
    try {
      await MOSService.provisionCloud();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      alert("Cloud database provisioned successfully!");
    } catch (err) {
      alert("Provisioning failed. Did you run the SQL schema in your Supabase dashboard first?");
      console.error(err);
    } finally {
      setIsProvisioning(false);
    }
  };

  const sqlSchema = `-- Run this in your Supabase SQL Editor
CREATE TABLE saccos (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE);
CREATE TABLE branches (id TEXT PRIMARY KEY, sacco_id TEXT REFERENCES saccos(id), name TEXT NOT NULL, location TEXT NOT NULL);
CREATE TABLE routes (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL, origin TEXT NOT NULL, destination TEXT NOT NULL, base_fare NUMERIC NOT NULL, segments TEXT[]);
CREATE TABLE vehicles (id TEXT PRIMARY KEY, plate TEXT NOT NULL UNIQUE, sacco_id TEXT REFERENCES saccos(id), branch_id TEXT REFERENCES branches(id), capacity INTEGER NOT NULL, type TEXT NOT NULL, last_location TEXT);
CREATE TABLE crews (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, phone TEXT NOT NULL, trust_score NUMERIC DEFAULT 100, incentive_balance NUMERIC DEFAULT 0);
CREATE TABLE trips (id TEXT PRIMARY KEY, route_id TEXT REFERENCES routes(id), vehicle_id REFERENCES vehicles(id), driver_id REFERENCES crews(id), conductor_id REFERENCES crews(id), branch_id REFERENCES branches(id), status TEXT NOT NULL, scheduled_time TEXT NOT NULL, total_revenue NUMERIC DEFAULT 0, ticket_count INTEGER DEFAULT 0);
CREATE TABLE tickets (id TEXT PRIMARY KEY, trip_id REFERENCES trips(id), passenger_phone TEXT NOT NULL, amount NUMERIC NOT NULL, timestamp TIMESTAMPTZ DEFAULT NOW(), synced BOOLEAN DEFAULT TRUE);
CREATE TABLE daily_anchors (id TEXT PRIMARY KEY, date DATE NOT NULL, sacco_id TEXT REFERENCES saccos(id), revenue_hash TEXT NOT NULL, tx_id TEXT, verified BOOLEAN DEFAULT TRUE, operation_count INTEGER NOT NULL);
CREATE TABLE incentive_transactions (id TEXT PRIMARY KEY, operator_id REFERENCES crews(id), amount NUMERIC NOT NULL, reason TEXT NOT NULL, timestamp TIMESTAMPTZ DEFAULT NOW());`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Setup</h1>
        <p className="text-slate-500 mt-1">Connect your local Mobility Operating System to the Supabase Cloud.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center space-x-3 mb-6">
            <div className={`p-3 rounded-2xl ${isSupabaseConfigured ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
              <Database size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Project Connection</h3>
              <p className="text-xs text-slate-500">{isSupabaseConfigured ? 'Active & Ready' : 'Incomplete Configuration'}</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Supabase Host</p>
              <p className="text-sm font-mono text-slate-700">db.{PROJECT_ID}.supabase.co</p>
            </div>
            {!isSupabaseConfigured && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  The <span className="font-bold underline">SUPABASE_ANON_KEY</span> environment variable is missing. The app is currently running in "Mock Mode" (Local Memory only).
                </p>
              </div>
            )}
          </div>

          <button 
            onClick={handleProvision}
            disabled={isProvisioning || !isSupabaseConfigured}
            className={`mt-8 w-full py-4 flex items-center justify-center space-x-3 rounded-2xl font-bold transition-all shadow-lg ${
              isProvisioning ? 'bg-slate-100 text-slate-400' : 
              !isSupabaseConfigured ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed' :
              'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30'
            }`}
          >
            {isProvisioning ? <RefreshCcw size={18} className="animate-spin" /> : <CloudUpload size={18} />}
            <span>{isProvisioning ? 'Pushing Data...' : 'Push Local Data to Cloud'}</span>
          </button>
        </div>

        <div className="bg-[#1e293b] text-white p-8 rounded-3xl shadow-xl flex flex-col h-full relative group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Terminal size={20} className="text-blue-400" />
              <h3 className="font-bold">Supabase SQL Schema</h3>
            </div>
            <button 
              onClick={() => {navigator.clipboard.writeText(sqlSchema); alert("SQL copied!");}}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <Copy size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <pre className="text-[10px] font-mono text-blue-300 leading-relaxed overflow-y-auto h-full max-h-[250px] scrollbar-thin scrollbar-thumb-slate-700">
              {sqlSchema}
            </pre>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1e293b] to-transparent pointer-events-none"></div>
          </div>
          <p className="mt-4 text-[10px] text-slate-400 italic">
            Note: Copy and paste the above into the "SQL Editor" of your Supabase project before clicking "Push Local Data".
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-6 flex items-center">
          <CheckCircle2 size={18} className="mr-2 text-green-500" /> Setup Checklist
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: 1, title: 'Supabase Instance', desc: 'Project created at mwtcpvucvqwqbsdlbrcn', status: 'COMPLETED' },
            { step: 2, title: 'Database Schema', desc: 'Run SQL in your Supabase Dashboard', status: 'PENDING' },
            { step: 3, title: 'Data Hydration', desc: 'Click "Push Local Data" above', status: 'PENDING' }
          ].map(item => (
            <div key={item.step} className="p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {item.step}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {item.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemSetup;
