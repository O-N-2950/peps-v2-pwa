import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign } from 'lucide-react';

export default function PartnerDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch('/api/partner/booking-stats', { headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`} })
      .then(r=>r.json()).then(setStats);
  }, []);

  if(!stats) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="p-6 pb-24 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-black mb-6">Mon Activité</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-[#14b8a6]">
            <div className="text-xs text-gray-400 font-bold uppercase mb-1">Réservations</div>
            <div className="text-3xl font-black">{stats.month_total}</div>
            <div className="text-[10px] text-green-600 font-bold">{stats.confirmed} confirmées</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-[#f97316]">
            <div className="text-xs text-gray-400 font-bold uppercase mb-1">CA Estimé</div>
            <div className="text-3xl font-black">{stats.revenue}.-</div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 h-64">
        <h3 className="font-bold text-sm mb-4">Activité (30j)</h3>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.chart}><XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false}/><Tooltip/><Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={3} dot={false}/></LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
