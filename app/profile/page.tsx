'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, MapPin, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_BOOKINGS = [
  {
    id: 'SPS-2026-8492',
    plan: 'Neon Nights',
    date: '2026-05-12',
    time: '20:00',
    location: 'Hongdae',
    status: 'Confirmed',
    total: 200,
    groupSize: 2,
    addons: ['Retouching']
  },
  {
    id: 'SPS-2025-1123',
    plan: 'Seoul Quick Shot',
    date: '2025-10-05',
    time: '14:00',
    location: 'Myeongdong',
    status: 'Completed',
    total: 120,
    groupSize: 1,
    addons: []
  }
];

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCancel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to cancel this booking?')) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
    }
  };

  const handleChangeDate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    alert('Date change request sent to support. We will contact you shortly.');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center pt-32">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-medium tracking-tight text-black">Please log in</h1>
          <p className="text-gray-500 font-medium">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-black selection:bg-black selection:text-white pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-16">
          <div>
            <h1 className="text-4xl font-medium tracking-tight mb-2">Profile</h1>
            <p className="text-gray-500 font-medium">{user.name} ({user.email})</p>
          </div>
          <button 
            onClick={signOut} 
            className="px-6 py-2.5 border border-black/10 rounded-full text-sm font-medium hover:bg-black/5 transition-colors"
          >
            Log Out
          </button>
        </div>

        <h2 className="text-2xl font-medium tracking-tight mb-8">Your Bookings</h2>
        <div className="space-y-4">
          {bookings.map(booking => {
            const isExpanded = expandedId === booking.id;
            const isCancelled = booking.status === 'Cancelled';
            
            return (
              <div 
                key={booking.id} 
                onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                className={`border border-black/10 rounded-2xl bg-white shadow-sm overflow-hidden cursor-pointer transition-colors hover:border-black/20 ${isExpanded ? 'ring-1 ring-black/5' : ''}`}
              >
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className={`font-medium text-xl ${isCancelled ? 'text-gray-400 line-through' : 'text-black'}`}>{booking.plan}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        booking.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-200' : 
                        booking.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className={`flex items-center gap-5 text-sm font-medium ${isCancelled ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span className="flex items-center gap-1.5"><Calendar size={16} /> {booking.date} at {booking.time}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={16} /> {booking.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6 mt-2 md:mt-0">
                    <div className={`text-left md:text-right ${isCancelled ? 'text-gray-400' : ''}`}>
                      <div className="text-sm font-medium mb-1 opacity-70">Ref: {booking.id}</div>
                      <div className="font-medium text-xl">${booking.total}</div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black"
                    >
                      <ChevronDown size={18} />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="border-t border-black/5"
                    >
                      <div className="p-6 bg-black/[0.02]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                          <div>
                            <h4 className="text-sm font-bold tracking-wider uppercase text-gray-500 mb-4">Booking Details</h4>
                            <ul className="space-y-3 text-sm font-medium text-black">
                              <li className="flex justify-between"><span className="text-gray-500">Group Size</span> <span>{booking.groupSize} {booking.groupSize > 1 ? 'People' : 'Person'}</span></li>
                              <li className="flex justify-between"><span className="text-gray-500">Add-ons</span> <span>{booking.addons.length > 0 ? booking.addons.join(', ') : 'None'}</span></li>
                              <li className="flex justify-between"><span className="text-gray-500">Total Paid</span> <span>${booking.total}</span></li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold tracking-wider uppercase text-gray-500 mb-4">Actions</h4>
                            {booking.status === 'Confirmed' ? (
                              <div className="space-y-3">
                                <button 
                                  onClick={(e) => handleChangeDate(booking.id, e)}
                                  className="w-full py-2.5 px-4 bg-white border border-black/10 rounded-xl text-sm font-medium text-black hover:bg-black/5 transition-colors text-left flex items-center justify-between"
                                >
                                  Change Date & Time
                                  <Calendar size={16} className="text-gray-500" />
                                </button>
                                <button 
                                  onClick={(e) => handleCancel(booking.id, e)}
                                  className="w-full py-2.5 px-4 bg-red-50 border border-red-100 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 transition-colors text-left flex items-center justify-between"
                                >
                                  Cancel Booking
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 font-medium">No actions available for this booking.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
