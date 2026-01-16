
import React, { useState } from 'react';
import { Bus, MapPin, Clock, ArrowRight, User, MoreVertical, Ticket as TicketIcon } from 'lucide-react';
import { MOCK_DB } from '../services/db';
import { TripStatus } from '../types';
import { MOSService } from '../services/mosService';

const Trips: React.FC = () => {
  const [trips, setTrips] = useState([...MOCK_DB.trips]);
  const [ticketModal, setTicketModal] = useState<{tripId: string, open: boolean}>({ tripId: '', open: false });
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('50');

  const handleDispatch = async (id: string) => {
    await MOSService.updateTripStatus(id, TripStatus.ACTIVE);
    setTrips([...MOCK_DB.trips]);
  };

  const handleComplete = async (id: string) => {
    await MOSService.updateTripStatus(id, TripStatus.COMPLETED);
    setTrips([...MOCK_DB.trips]);
  };

  const handleIssueTicket = async () => {
    if (!phone) return;
    await MOSService.issueTicket(ticketModal.tripId, phone, parseInt(amount));
    setPhone('');
    setTicketModal({ tripId: '', open: false });
    setTrips([...MOCK_DB.trips]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Trip Operations</h1>
        <div className="flex space-x-2">
           <select className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none">
             <option>All Statuses</option>
             <option>Active</option>
             <option>Ready</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {trips.map(trip => {
          const route = MOCK_DB.routes.find(r => r.id === trip.routeId);
          const vehicle = MOCK_DB.vehicles.find(v => v.id === trip.vehicleId);
          const driver = MOCK_DB.crews.find(c => c.id === trip.driverId);
          
          return (
            <div key={trip.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-200 transition-colors shadow-sm">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${trip.status === TripStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Bus size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-400">{trip.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        trip.status === TripStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center">
                      {route?.origin} <ArrowRight size={16} className="mx-2 text-slate-300" /> {route?.destination}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center"><User size={14} className="mr-1" /> {driver?.name}</span>
                      <span className="flex items-center"><Clock size={14} className="mr-1" /> {trip.scheduledTime}</span>
                      <span className="font-bold text-slate-900">{vehicle?.plate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 px-6 border-l border-slate-100">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                    <p className="text-lg font-black text-slate-900">KSh {trip.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tickets</p>
                    <p className="text-lg font-black text-slate-900">{trip.ticketCount}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                   {trip.status === TripStatus.READY && (
                     <button 
                       onClick={() => handleDispatch(trip.id)}
                       className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700"
                     >
                       Dispatch
                     </button>
                   )}
                   {trip.status === TripStatus.ACTIVE && (
                     <>
                      <button 
                        onClick={() => setTicketModal({ tripId: trip.id, open: true })}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 flex items-center"
                      >
                        <TicketIcon size={16} className="mr-2" /> Ticket
                      </button>
                      <button 
                        onClick={() => handleComplete(trip.id)}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black"
                      >
                        Complete
                      </button>
                     </>
                   )}
                   <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><MoreVertical size={20} /></button>
                </div>
              </div>

              {/* Segment Progress Bar */}
              {trip.status === TripStatus.ACTIVE && route && (
                <div className="px-6 pb-4">
                   <div className="flex justify-between mb-2">
                     {route.segments.map((seg, idx) => (
                       <div key={seg} className="flex flex-col items-center flex-1">
                          <div className={`h-1.5 w-full rounded-full ${idx < 2 ? 'bg-blue-500' : 'bg-slate-100'}`}></div>
                          <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{seg}</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ticket Modal */}
      {ticketModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
             <h2 className="text-2xl font-black text-slate-900 mb-2">Issue Ticket</h2>
             <p className="text-slate-500 text-sm mb-6">Enter passenger details. SMS will be sent instantly.</p>
             
             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="254700000000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fare Amount (KES)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-lg"
                  />
                </div>
             </div>

             <div className="flex space-x-3 mt-8">
               <button 
                 onClick={() => setTicketModal({ tripId: '', open: false })}
                 className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleIssueTicket}
                 className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
               >
                 Send SMS Ticket
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
