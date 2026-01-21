import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Store, Gift } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ mrr_chf: 0, mrr_eur: 0, members: 0, partners: 0 });
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  const data = [
    { name: 'Jan', mrr: 12000 },
    { name: 'Fév', mrr: 15000 },
    { name: 'Mar', mrr: 18000 },
    { name: 'Avr', mrr: 22000 },
    { name: 'Mai', mrr: 28000 },
    { name: 'Juin', mrr: 35000 }
  ];

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div><p className="text-sm text-gray-500 mb-1">{label}</p><p className="text-3xl font-bold text-gray-900">{value}</p></div>
        <div className={`p-3 rounded-full ${color}`}><Icon size={24} className="text-white" /></div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Admin V20</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={TrendingUp} label="MRR Total (CHF)" value={`${stats.mrr_chf.toLocaleString()} CHF`} color="bg-green-500" />
        <StatCard icon={TrendingUp} label="MRR Total (EUR)" value={`${stats.mrr_eur.toLocaleString()} €`} color="bg-blue-500" />
        <StatCard icon={Users} label="Membres Actifs" value={stats.members} color="bg-purple-500" />
        <StatCard icon={Store} label="Partenaires" value={stats.partners} color="bg-[#3D9A9A]" />
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6">Évolution MRR (6 derniers mois)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="mrr" stroke="#3D9A9A" fill="#3D9A9A" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
