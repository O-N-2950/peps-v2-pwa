import React, { useState, useEffect } from 'react';
import { Users, Store, Activity, Search, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [partners, setPartners] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const h = { 'Authorization': `Bearer ${token}` };
    fetch('/api/admin/global-stats', { headers: h }).then(r=>r.json()).then(setStats);
    fetch('/api/admin/partners-overview', { headers: h }).then(r=>r.json()).then(setPartners);
  }, []);

  if (!stats) return <div className="p-10 text-center">Chargement...</div>;
  const filtered = partners.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-6 bg-gray-50 min-h-screen pb-24">
      <h1 className="text-3xl font-black text-gray-900 mb-6">Admin Master</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi icon={<Store/>} label="Partenaires" val={stats.total_partners} />
        <Kpi icon={<Users/>} label="Membres" val={stats.total_members} />
        <Kpi icon={<Activity/>} label="Followers" val={stats.total_followers} color="text-peps-turquoise"/>
        <Kpi icon={<Activity/>} label="Moyenne/Part" val={stats.avg_engagement} />
      </div>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex gap-2 bg-gray-50">
            <Search size={20} className="text-gray-400"/>
            <input className="bg-transparent outline-none text-sm w-full" placeholder="Rechercher un partenaire..." value={filter} onChange={e=>setFilter(e.target.value)}/>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-500 uppercase text-xs">
                    <tr><th className="p-4">Nom</th><th className="p-4">Followers</th><th className="p-4">Offres</th><th className="p-4">Statut</th></tr>
                </thead>
                <tbody>
                    {filtered.map(p => (
                        <tr key={p.id} className="border-t hover:bg-gray-50">
                            <td className="p-4 font-bold">{p.name}<div className="text-xs text-gray-400 font-normal">{p.category}</div></td>
                            <td className="p-4 font-mono font-bold text-peps-turquoise">{p.followers_count}</td>
                            <td className="p-4">{p.active_offers_count}</td>
                            <td className="p-4">
                                {p.status==='active' ? <span className="text-green-600 text-xs font-bold flex gap-1"><CheckCircle size={12}/> OK</span> : <span className="text-red-500 text-xs font-bold flex gap-1"><AlertTriangle size={12}/> LOW</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

const Kpi = ({icon, label, val, color='text-gray-900'}) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1">{icon} {label}</div>
        <div className={`text-2xl font-black ${color}`}>{val}</div>
    </div>
);