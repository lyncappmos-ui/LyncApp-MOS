
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Bus, Users, BarChart3, FileText, Settings, Plus, MapPin, Search, ChevronDown, Bell, LogOut, Wifi, WifiOff, ShieldCheck } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Trips from './components/Trips';
import Incentives from './components/Incentives';
import IntegrityVerification from './components/IntegrityVerification';
import { TripStatus } from './types';
import { MOSService } from './services/mosService';
import { bus, MOSEvents } from './services/eventBus';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [user] = useState({ name: 'Collins Mvungi', role: 'Operations Manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Collins' });

  useEffect(() => {
    const handleSms = (log: any) => {
      setNotifications(prev => [`SMS Sent to ${log.phoneNumber}`, ...prev].slice(0, 5));
    };
    bus.on(MOSEvents.SMS_SENT, handleSms);
    return () => bus.off(MOSEvents.SMS_SENT, handleSms);
  }, []);

  const toggleOnline = () => {
    const next = !isOnline;
    setIsOnline(next);
    MOSService.setOnline(next);
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'trips', icon: Bus, label: 'Trips' },
    { id: 'incentives', icon: FileText, label: 'Trust & Ledger' },
    { id: 'verification', icon: ShieldCheck, label: 'Integrity Portal' },
    { id: 'fleet', icon: Bus, label: 'Fleet' },
    { id: 'drivers', icon: Users, label: 'Crews' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans selection:bg-blue-100">
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col shadow-2xl z-20 relative">
        <div className="p-8 flex items-center space-x-4 border-b border-slate-800">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/20">L</div>
          <div>
            <span className="text-xl font-black tracking-tight block">LyncApp</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">MOS Core</span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-4 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'animate-pulse' : ''} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-4">
          <button 
            onClick={toggleOnline}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
              isOnline ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
              <span className="text-xs font-bold uppercase">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-10">
          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search registry..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500/50 transition-all text-sm"
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-1">{user.role}</p>
              </div>
              <img src={user.avatar} alt="User" className="w-11 h-11 rounded-2xl ring-4 ring-slate-100 shadow-sm" />
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto w-full pb-20">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'trips' && <Trips />}
          {activeTab === 'incentives' && <Incentives />}
          {activeTab === 'verification' && <IntegrityVerification />}
          {['fleet', 'drivers'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
                <Bus size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Module Provisioning</h2>
              <button onClick={() => setActiveTab('dashboard')} className="mt-8 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl">
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
