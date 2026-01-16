import React, { useState, useEffect } from 'react';
import { Users, Store, Calendar, DollarSign } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [chart, setChart] = useState([]);

  useEffect(() => {
    const h = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    fetch('/api/admin/global-stats', {headers: h}).then(r=>r.json()).then(setStats);
    fetch('/api/admin/booking-stats', {headers: h}).then(r=>r.json()).then(setChart);
    fetch('/api/admin/bookings', {headers: h}).then(r=>r.json()).then(setBookings);
  }, []);

  if(!stats) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen pb-24">
      <h1 className="text-3xl font-black mb-6">Admin V9</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm"><div className="text-xs text-gray-400 font-bold">MEMBRES</div><div className="text-2xl font-black">{stats.members}</div></div>
        <div className="bg-white p-4 rounded-2xl shadow-sm"><div className="text-xs text-gray-400 font-bold">PARTNERS</div><div className="text-2xl font-black">{stats.partners}</div></div>
        <div className="bg-white p-4 rounded-2xl shadow-sm"><div className="text-xs text-gray-400 font-bold">RÉSERVATIONS</div><div className="text-2xl font-black text-[#14b8a6]">{stats.bookings_month}</div></div>
        <div className="bg-white p-4 rounded-2xl shadow-sm"><div className="text-xs text-gray-400 font-bold">REVENU</div><div className="text-2xl font-black text-[#f97316]">{stats.total_revenue}.-</div></div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-8 h-48">
        <ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><Line type="monotone" dataKey="val" stroke="#14b8a6" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer>
      </div>
      <h3 className="font-bold mb-3">Flux Réservations</h3>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {bookings.map(b => (
            <div key={b.id} className="p-3 border-b flex justify-between text-sm">
                <div><div className="font-bold">{b.partner}</div><div className="text-xs text-gray-400">{b.date}</div></div>
                <div className="font-mono">{b.amount}.-</div>
            </div>
        ))}
      </div>
    </div>
  );
}
