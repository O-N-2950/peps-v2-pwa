import React, { useState, useEffect } from 'react';
import { Users, Store, Activity, Search, CheckCircle, AlertTriangle, LogOut, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [partners, setPartners] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // Chargement parallèle des données
            const [resStats, resPartners, resBookings] = await Promise.all([
                fetch('/api/admin/global-stats', { headers }),
                fetch('/api/admin/partners-overview', { headers }),
                fetch('/api/admin/bookings', { headers })
            ]);

            if (!resStats.ok) throw new Error("Erreur chargement Stats");

            setStats(await resStats.json());
            setPartners(await resPartners.json() || []);
            setBookings(await resBookings.json() || []);
        } catch (err) {
            console.error("Admin Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [navigate]);

  // GESTION DES ÉTATS (Anti-Page Blanche)
  if (loading) return (
      <div className="h-screen flex flex-col items-center justify-center bg-white text-[#3D9A9A] font-bold animate-pulse">
          Chargement Admin...
      </div>
  );

  if (error) return (
      <div className="p-10 text-center text-red-500">
          <h2 className="font-bold">Erreur</h2>
          <p className="text-sm">{error}</p>
          <button onClick={() => {localStorage.clear(); navigate('/login')}} className="mt-4 underline">Déconnexion</button>
      </div>
  );

  const filtered = partners.filter(p => p.name.toLowerCase().includes('')); 

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black text-gray-900">Admin Master</h1>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="bg-white p-2 rounded-full shadow text-red-500">
              <LogOut size={20}/>
          </button>
      </div>
      
      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Kpi icon={<Store/>} label="Partenaires" val={stats.total_partners} />
        <Kpi icon={<Users/>} label="Membres" val={stats.total_members} />
        <Kpi icon={<Activity/>} label="Followers" val={stats.total_followers} color="text-[#3D9A9A]"/>
        <Kpi icon={<Calendar/>} label="Réservations" val={stats.total_bookings} />
      </div>

      {/* TABLEAU */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-500 uppercase text-[10px]">
                    <tr><th className="p-3">Nom</th><th className="p-3">Follows</th><th className="p-3">Statut</th></tr>
                </thead>
                <tbody>
                    {partners.map(p => (
                        <tr key={p.id} className="border-t hover:bg-gray-50">
                            <td className="p-3">
                                <div className="font-bold text-gray-900">{p.name}</div>
                                <div className="text-[10px] text-gray-400">{p.category}</div>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#3D9A9A]">{p.followers_count}</td>
                            <td className="p-3">
                                {p.status==='active' 
                                    ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold">OK</span> 
                                    : <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] font-bold">LOW</span>}
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
    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase mb-1">{icon} {label}</div>
        <div className={`text-xl font-black ${color}`}>{val}</div>
    </div>
);
