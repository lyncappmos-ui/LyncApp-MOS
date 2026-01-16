
import React from 'react';
import { X, ShieldCheck, Download, Copy, Share2, Terminal } from 'lucide-react';
import { VerifiableCredential } from '../types';

interface CredentialModalProps {
  credential: VerifiableCredential | null;
  onClose: () => void;
}

const CredentialModal: React.FC<CredentialModalProps> = ({ credential, onClose }) => {
  if (!credential) return null;

  const jsonString = JSON.stringify(credential, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    alert('Credential copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={24} />
        </button>

        <div className="p-8 md:p-12">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <ShieldCheck size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trust Credential</h2>
              <p className="text-slate-500 font-medium">Cryptographically signed reputation proof</p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl overflow-hidden mb-8">
            <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signed JSON-LD Proof</span>
              </div>
              <button 
                onClick={handleCopy}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest"
              >
                Copy Raw
              </button>
            </div>
            <pre className="p-6 text-blue-400 font-mono text-xs overflow-x-auto leading-relaxed max-h-64 scrollbar-thin scrollbar-thumb-slate-700">
              {jsonString}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Issuer Authority</p>
              <p className="text-xs font-mono text-slate-700 truncate">{credential.issuer}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Subject DID</p>
              <p className="text-xs font-mono text-slate-700 truncate">{credential.subject}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <button 
              onClick={handleCopy}
              className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center"
            >
              <Copy size={18} className="mr-2" /> Copy Credential
            </button>
            <button className="flex-1 py-4 bg-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center">
              <Download size={18} className="mr-2" /> Save PDF
            </button>
            <button className="py-4 px-6 bg-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center">
              <Share2 size={18} />
            </button>
          </div>
          
          <p className="text-center text-[10px] text-slate-400 mt-6 font-medium">
            This credential is W3C compliant and anchored to the Celo Blockchain.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CredentialModal;
