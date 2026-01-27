
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Users, TrendingUp, Zap, Sparkles, Gift, BarChart2, Plus, Trash2, LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';


export default function PartnerDashboard() {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [privileges, setPrivileges] = useState([]);
  const [offers, setOffers] = useState([]); // Flash offers
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    try {
        const [rStats, rPrivs, rFlash] = await Promise.all([
            fetch('/api/partner/statistics', {headers}).then(r=>r.json()),
            fetch('/api/partner/privileges', {headers}).then(r=>r.json()),
            fetch('/api/partner/flash-offers', {headers}).then(r=>r.json())
        ]);
        setStats(rStats); setPrivileges(rPrivs); setOffers(rFlash);
        setLoading(false);
    } catch (e) {
        console.error(e); toast.error("Erreur de chargement"); setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const createOffer = async () => {
    const endpoint = showModal === 'flash' ? '/api/partner/flash-offers' : '/api/partner/privileges';
    const body = { ...form, type: showModal === 'flash' ? 'flash' : 'permanent' };
    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    
    if(res.ok) {
        toast.success("Créé avec succès !");
        setShowModal(false); fetchData();
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-[#3D9A9A]">Chargement V16...</div>;

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <Toaster position="top-center" />
      <header className="bg-[#3D9A9A] p-6 text-white flex justify-between items-center shadow-lg">
        <h1 className="font-black text-xl">Espace Pro</h1>
        <button onClick={()=>{localStorage.clear(); window.location.href='/login'}}><LogOut size={20}/></button>
      </header>

      <div className="flex bg-white shadow-sm mb-4">
        {[{id:'stats', icon:BarChart2, l:'Stats'}, {id:'privileges', icon:Gift, l:'Privilèges'}, {id:'flash', icon:Zap, l:'Push'}].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} className={`flex-1 py-3 flex flex-col items-center text-xs font-bold ${tab===t.id ? 'text-[#3D9A9A] border-b-4 border-[#3D9A9A]' : 'text-gray-400'}`}>
                <t.icon size={20} className="mb-1"/> {t.l}
            </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'stats' && stats && (
            <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-[#3D9A9A]">
                        <div className="text-gray-400 text-xs uppercase font-bold">Total Mois</div>
                        <div className="text-3xl font-black text-gray-800">{stats.total_month}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-400">
                        <div className="text-gray-400 text-xs uppercase font-bold">Aujourd'hui</div>
                        <div className="text-3xl font-black text-gray-800">{stats.today}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm h-64">
                    <h3 className="font-bold mb-4 text-sm">Activité 7 jours</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chart}>
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false}/>
                            <Tooltip />
                            <Bar dataKey="uses" fill="#3D9A9A" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h3 className="font-bold mb-4 text-sm">Top Privilèges</h3>
                    {stats.top_offers && stats.top_offers.length > 0 ? (
                        stats.top_offers.map((o, i) => (
                            <div key={i} className="flex justify-between py-2 border-b last:border-0 text-sm">
                                <span>{o.title}</span><span className="font-bold text-[#3D9A9A]">{o.count}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-400 py-4 text-sm">Aucune donnée disponible</div>
                    )}
                </div>
            </div>
        )}

        {(tab === 'privileges' || tab === 'flash') && (
            <div>
                <button onClick={()=>{setForm({}); setShowModal(tab)}} className="w-full bg-black text-white p-4 rounded-xl font-bold mb-4 flex justify-center gap-2 shadow-lg">
                    <Plus/> CRÉER {tab === 'flash' ? 'PUSH' : 'PRIVILÈGE'}
                </button>
                <div className="space-y-3">
                    {(tab === 'flash' ? offers : privileges) && (tab === 'flash' ? offers : privileges).length > 0 ? (
                        (tab === 'flash' ? offers : privileges).map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-800">{p.title}</h3>
                                    <div className="text-xs text-gray-500">{p.type} • {tab==='flash' ? `Stock: ${p.stock}` : `Utilisé ${p.total_uses}x`}</div>
                                </div>
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">ACTIF</span>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                            <div className="text-5xl mb-3">🎁</div>
                            <h3 className="font-bold text-gray-700 mb-2">Aucun {tab === 'flash' ? 'push' : 'privilège'} pour le moment</h3>
                            <p className="text-sm text-gray-500">Créez votre premier {tab === 'flash' ? 'push' : 'privilège'} pour commencer !</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-sm p-6 rounded-2xl space-y-4">
                <h2 className="font-bold text-lg">Nouveau {showModal === 'flash' ? 'Push' : 'Privilège'}</h2>
                <input className="w-full p-3 border rounded" placeholder="Titre" onChange={e=>setForm({...form, title:e.target.value})}/>
                <input className="w-full p-3 border rounded" placeholder="Valeur (ex: -20%)" onChange={e=>setForm({...form, value:e.target.value, type:e.target.value})}/>
                {showModal === 'flash' ? (
                    <input type="number" className="w-full p-3 border rounded" placeholder="Stock" onChange={e=>setForm({...form, slots:e.target.value})}/>
                ) : (
                    <textarea className="w-full p-3 border rounded" placeholder="Description..." onChange={e=>setForm({...form, description:e.target.value})}/>
                )}
                <div className="flex gap-2">
                    <button onClick={()=>setShowModal(false)} className="flex-1 py-3 text-gray-500">Annuler</button>
                    <button onClick={createOffer} className="flex-1 bg-[#3D9A9A] text-white rounded font-bold">Créer</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}