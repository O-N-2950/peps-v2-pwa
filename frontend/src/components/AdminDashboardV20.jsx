import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Store, Activity, Database, Download, Search } from 'lucide-react';

export default function AdminDashboardV20() {
  const [stats, setStats] = useState(null);
  const [partners, setPartners] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    const h = { 'Authorization': `Bearer ${token}` };
    
    try {
      const statsRes = await fetch('/api/admin/stats_v20', { headers: h });
      const statsData = await statsRes.json();
      setStats(statsData);
      
      const partnersRes = await fetch(`/api/admin/partners?page=${page}`, { headers: h });
      const partnersData = await partnersRes.json();
      setPartners(partnersData.items || []);
      setTotalPages(partnersData.pages || 1);
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
    
    setLoading(false);
  };

  const runMigration = async () => {
      if(!confirm("⚠️ Lancer la migration des 67 partenaires depuis Firestore ?\n\nCela peut prendre 1-2 minutes.")) return;
      
      setLoading(true);
      try {
        const res = await fetch('/api/admin/run_migration', { 
          headers: {'Authorization': `Bearer ${token}`} 
        });
        const d = await res.json();
        
        if(d.status === 'success') {
          alert(`✅ Migration réussie !\n\n${d.log?.length || 0} partenaires importés.`);
          loadData(); // Recharger les données
        } else {
          alert(`❌ Erreur: ${d.error || 'Migration échouée'}`);
        }
      } catch (error) {
        alert(`❌ Erreur réseau: ${error.message}`);
      }
      setLoading(false);
  };

  if(!stats) return (
    <div className="p-10 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#3D9A9A] mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement Admin V20...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">Dashboard Admin V20</h1>
              <p className="text-gray-500 text-sm">Gestion complète de la plateforme PEP's</p>
            </div>
            <button 
              onClick={runMigration} 
              disabled={loading}
              className="bg-gradient-to-r from-[#3D9A9A] to-[#2D7A7A] text-white px-6 py-3 rounded-xl font-bold flex gap-2 items-center hover:shadow-xl transition disabled:opacity-50"
            >
                <Database size={18}/> {loading ? 'MIGRATION...' : 'IMPORTER DONNÉES'}
            </button>
        </header>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard 
              icon={<DollarSign/>} 
              label="MRR" 
              val={`${stats.mrr} CHF`} 
              col="text-green-600"
              bg="bg-green-50"
            />
            <StatCard 
              icon={<Users/>} 
              label="Membres" 
              val={stats.members} 
              col="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard 
              icon={<Store/>} 
              label="Partenaires" 
              val={`${stats.partners}`} 
              col="text-[#3D9A9A]"
              bg="bg-teal-50"
            />
            <StatCard 
              icon={<Activity/>} 
              label="Utilisations" 
              val={stats.usage} 
              col="text-purple-600"
              bg="bg-purple-50"
            />
        </div>

        {/* Partners Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-black text-xl text-gray-900">Liste des Partenaires</h3>
                  <p className="text-sm text-gray-500 mt-1">Total: {stats.partners} partenaires</p>
                </div>
                <div className="flex gap-2">
                    <button 
                      onClick={()=>setPage(p=>Math.max(1,p-1))} 
                      disabled={page === 1}
                      className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition disabled:opacity-30"
                    >
                      ← Préc
                    </button>
                    <span className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">
                      {page} / {totalPages}
                    </span>
                    <button 
                      onClick={()=>setPage(p=>p+1)} 
                      disabled={page >= totalPages}
                      className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition disabled:opacity-30"
                    >
                      Suiv →
                    </button>
                </div>
            </div>
            
            {loading ? (
              <div className="p-10 text-center text-gray-500">Chargement...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-600 uppercase bg-gray-100 border-b-2">
                      <tr>
                        <th className="p-4 font-black">ID</th>
                        <th className="p-4 font-black">Nom</th>
                        <th className="p-4 font-black">Catégorie</th>
                        <th className="p-4 font-black">Email</th>
                        <th className="p-4 font-black">Ville</th>
                        <th className="p-4 font-black">Offres</th>
                      </tr>
                    </thead>
                    <tbody>
                        {partners.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-10 text-center text-gray-500">
                              Aucun partenaire trouvé. Lancez la migration pour importer les données.
                            </td>
                          </tr>
                        ) : (
                          partners.map(p => (
                            <tr key={p.id} className="border-t hover:bg-teal-50 transition">
                                <td className="p-4 text-gray-500 font-mono text-xs">#{p.id}</td>
                                <td className="p-4 font-bold text-gray-900">{p.name}</td>
                                <td className="p-4">
                                  <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-bold">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="p-4 text-gray-600 text-xs">{p.email || '-'}</td>
                                <td className="p-4 text-gray-600">{p.city || '-'}</td>
                                <td className="p-4 text-center">
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold">
                                    {p.offers || 0}
                                  </span>
                                </td>
                            </tr>
                          ))
                        )}
                    </tbody>
                </table>
              </div>
            )}
        </div>
    </div>
  );
}

const StatCard = ({icon, label, val, col='text-black', bg='bg-gray-50'}) => (
    <div className={`${bg} p-6 rounded-2xl shadow-md border-2 border-gray-200 hover:shadow-xl transition`}>
        <div className="flex items-center gap-3 text-gray-500 text-xs font-bold uppercase mb-3">
          <div className={`${col}`}>{icon}</div>
          {label}
        </div>
        <div className={`text-4xl font-black ${col}`}>{val}</div>
    </div>
);
