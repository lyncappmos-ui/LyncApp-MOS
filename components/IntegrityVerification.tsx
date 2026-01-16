
import React, { useState } from 'react';
import { Search, ShieldCheck, AlertCircle, Cpu, ExternalLink, Database } from 'lucide-react';
import { MOCK_DB } from '../services/db';

const IntegrityVerification: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    setLoading(true);
    // Simulate lookup in mock DB or "Chain"
    setTimeout(() => {
      const anchor = MOCK_DB.dailyAnchors.find(a => a.txId === query || a.id === query || a.date === query);
      setResult(anchor || 'NOT_FOUND');
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Public Integrity Portal</h1>
        <p className="text-slate-500">
          Verify any operational report or revenue statement by checking its SHA-256 hash against the Celo Mainnet anchor.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Date (YYYY-MM-DD) or Transaction ID (0x...)" 
            className="w-full pl-14 pr-32 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono text-sm"
          />
          <button 
            onClick={handleVerify}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            Verify
          </button>
        </div>

        {loading && (
          <div className="mt-12 flex flex-col items-center justify-center space-y-4 animate-pulse">
            <Cpu className="text-blue-500 animate-spin" size={48} />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Querying Blockchain Nodes...</p>
          </div>
        )}

        {result && result !== 'NOT_FOUND' && !loading && (
          <div className="mt-12 bg-green-50 border border-green-200 rounded-2xl p-6 space-y-6 animate-in slide-in-from-top-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-green-900 uppercase">Integrity Verified</h3>
                <p className="text-green-700 text-sm">Hash matches the on-chain anchor recorded on {result.date}.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 p-4 rounded-xl border border-green-200">
                <p className="text-[10px] font-black text-green-800 uppercase mb-1">Blockchain Hash</p>
                <p className="text-xs font-mono break-all text-slate-700">{result.revenueHash}</p>
              </div>
              <div className="bg-white/50 p-4 rounded-xl border border-green-200">
                <p className="text-[10px] font-black text-green-800 uppercase mb-1">Network Transaction</p>
                <p className="text-xs font-mono break-all text-slate-700">{result.txId}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-green-100">
              <div className="flex items-center space-x-2">
                <Database size={14} className="text-green-600" />
                <span className="text-xs font-bold text-green-800">{result.operationCount} Operations Bundled</span>
              </div>
              <a href="#" className="flex items-center text-xs font-bold text-blue-600 hover:underline">
                View on CeloExplorer <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
          </div>
        )}

        {result === 'NOT_FOUND' && !loading && (
          <div className="mt-12 bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-3">
            <AlertCircle className="mx-auto text-red-500" size={48} />
            <h3 className="text-lg font-bold text-red-900">No Record Found</h3>
            <p className="text-red-700 text-sm">We could not locate an anchored proof for the provided query on the public ledger.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          { title: 'Write-Only', desc: 'No sensitive passenger data ever leaves your internal server.' },
          { title: 'Deterministic', desc: 'Every ticket contributes to the final daily operational hash.' },
          { title: 'Auditable', desc: 'Settle disputes instantly with immutable proof of revenue.' }
        ].map(item => (
          <div key={item.title} className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
            <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrityVerification;
