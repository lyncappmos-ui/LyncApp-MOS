
import React, { useState } from 'react';
import { ShieldCheck, Coins, History, ExternalLink, Cpu, UserCheck, ArrowRight, Award } from 'lucide-react';
import { MOCK_DB } from '../services/db';
import { VerifiableCredential } from '../types';
import { MOSService } from '../services/mosService';
import CredentialModal from './CredentialModal';

const Incentives: React.FC = () => {
  const [selectedCredential, setSelectedCredential] = useState<VerifiableCredential | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleGenerateCredential = async (operatorId: string) => {
    setLoadingId(operatorId);
    try {
      const vc = await MOSService.getVerifiableTrust(operatorId);
      if (vc) {
        setSelectedCredential(vc);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate credential.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Trust & Incentives</h1>
          <p className="text-slate-500 mt-1">Immutable ledger of operator performance and reputation proofs.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl flex items-center space-x-3">
          <Coins className="text-blue-600" size={20} />
          <span className="text-sm font-bold text-blue-900">Total Credits Issued: {MOCK_DB.crews.reduce((a, b) => a + b.incentiveBalance, 0).toLocaleString()} LYNC</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Operator Reputation Registry */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900 flex items-center">
                <UserCheck className="mr-2 text-blue-500" size={18} /> Reputation Registry
              </h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">W3C Credential Issuer</span>
            </div>
            <div className="divide-y divide-slate-50">
              {MOCK_DB.crews.map(crew => (
                <div key={crew.id} className="p-6 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-600">
                        {crew.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                        <ShieldCheck size={12} className="text-green-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{crew.name}</p>
                      <div className="flex items-center mt-1 space-x-3">
                        <span className="text-xs text-slate-500">{crew.role}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-xs font-bold text-blue-600">{crew.trustScore}% Score</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleGenerateCredential(crew.id)}
                    disabled={loadingId === crew.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-blue-300 transition-all disabled:opacity-50"
                  >
                    {loadingId === crew.id ? (
                      <Cpu size={14} className="animate-spin text-blue-500" />
                    ) : (
                      <Award size={14} className="text-blue-500" />
                    )}
                    <span>{loadingId === crew.id ? 'Signing...' : 'Issue VC Proof'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Incentive History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-900 flex items-center">
                <History className="mr-2 text-slate-400" size={18} /> Incentive History
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              {MOCK_DB.incentiveTransactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                   <p>No transactions recorded yet. Complete trips to award incentives.</p>
                </div>
              ) : (
                [...MOCK_DB.incentiveTransactions].reverse().slice(0, 5).map(tx => {
                  const operator = MOCK_DB.crews.find(c => c.id === tx.operatorId);
                  return (
                    <div key={tx.id} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {operator?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{operator?.name}</p>
                          <p className="text-xs text-slate-500">{tx.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-green-600">+{tx.amount} LYNC</p>
                        <p className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {MOCK_DB.incentiveTransactions.length > 5 && (
              <div className="p-4 text-center border-t border-slate-50">
                <button className="text-xs font-bold text-blue-600 flex items-center mx-auto hover:underline">
                  View full history <ArrowRight size={12} className="ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1e293b] text-white p-6 rounded-2xl shadow-xl">
             <h3 className="font-bold mb-4 flex items-center text-blue-400">
               <Cpu size={18} className="mr-2" /> Web3 Anchors
             </h3>
             <div className="space-y-4">
               {MOCK_DB.dailyAnchors.length === 0 ? (
                 <p className="text-xs text-slate-400 italic">No daily closures anchored yet.</p>
               ) : (
                 MOCK_DB.dailyAnchors.map(anchor => (
                   <div key={anchor.id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:border-slate-500 transition-colors">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold">{anchor.date}</span>
                       <ShieldCheck className="text-green-500" size={14} />
                     </div>
                     <div className="text-[10px] font-mono text-slate-400 break-all mb-2">
                       {anchor.revenueHash}
                     </div>
                     <div className="flex justify-between items-center border-t border-slate-700 pt-2 mt-2">
                       <span className="text-[10px] text-slate-500">{anchor.operationCount} Operations</span>
                       <a href="#" className="text-[10px] text-blue-400 hover:underline flex items-center">
                         TX <ExternalLink size={10} className="ml-1" />
                       </a>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>

      <CredentialModal 
        credential={selectedCredential} 
        onClose={() => setSelectedCredential(null)} 
      />
    </div>
  );
};

export default Incentives;
