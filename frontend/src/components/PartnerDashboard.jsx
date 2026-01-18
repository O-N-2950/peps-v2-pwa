import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Gift, Bell, BarChart, Calendar, Save, Plus, Trash, Send, LogOut } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function PartnerDashboard() {
  const [tab, setTab] = useState('stats');
  // États initialisés pour éviter le crash
  const [profile, setProfile] = useState({ name: 'Chargement...' });
  const [privileges, setPrivileges] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ followers: 0, views: 0, history_7d: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [notif, setNotif] = useState({title: '', message: ''});
  const [newOffer, setNewOffer] = useState({title: '', type: 'permanent', value: ''});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }
        
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        
        // Fonction Fetch Safe : Si erreur, retourne null mais ne casse pas le Promise.all
        const fetchSafe = (url) => fetch(url, {headers}).then(res => res.ok ? res.json() : null).catch(e => null);

        try {
            console.log("🚀 Chargement Dashboard...");
            // On charge tout en parallèle
            const [p, pr, s, b] = await Promise.all([
                fetch('/api/partner/profile', {headers}).then(res => { 
                    if(res.status === 401) throw new Error("Session expirée");
                    if(!res.ok) throw new Error("Erreur Profil"); 
                    return res.json();
                }),
                fetchSafe('/api/partner/privileges'),
                fetchSafe('/api/partner/stats_advanced'),
                fetchSafe('/api/partner/bookings'),
                fetchSafe('/api/partner/growth-suggestions')
            ]);

            setProfile(p);
            setPrivileges(pr || []);
            setStats(s || { followers: 0, views: 0, history_7d: [] });
            setBookings(b || []);
            
        } catch (err) {
            console.error("Dashboard Fatal Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [navigate]);

  const updateProfile = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
    await fetch('/api/partner/profile', {method:'PUT', headers, body: JSON.stringify(profile)});
    alert("Enregistré !");
  };

  const addOffer = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
    await fetch('/api/partner/privileges', {method:'POST', headers, body: JSON.stringify(newOffer)});
    window.location.reload();
  };

  const deleteOffer = async (id) => {
    if(confirm("Supprimer ?")) { 
        await fetch(`/api/partner/privileges?id=${id}`, {method:'DELETE', headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}}); 
        window.location.reload(); 
    }
  };

  const sendPush = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/partner/notifications', {method:'POST', headers, body: JSON.stringify(notif)});
    const d = await res.json();
    alert(`Envoyé à ${d.count} followers !`);
    setNotif({title:'', message:''});
  };

  const updateBooking = async (id, status) => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
    await fetch('/api/partner/bookings', {method:'PUT', headers, body: JSON.stringify({id, status})});
    window.location.reload();
  };

  if(loading) return <div className="min-h-screen flex items-center justify-center text-[#3D9A9A] font-bold animate-pulse">Chargement Dashboard...</div>;
  
  if(error) return (
      <div className="p-10 text-center">
          <h2 className="text-red-500 font-bold mb-2">Erreur de chargement</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button onClick={()=>{localStorage.clear(); window.location.href='/login'}} className="underline">Se reconnecter</button>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-6 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div>
            <h1 className="font-black text-xl text-[#3D9A9A] uppercase truncate max-w-[200px]">{profile.name}</h1>
            <p className="text-xs text-gray-400">{profile.category}</p>
        </div>
        <button onClick={()=>{localStorage.clear(); window.location.href='/login'}} className="text-red-400 bg-red-50 p-2 rounded-full"><LogOut size={18}/></button>
      </div>
      
      <div className="flex overflow-x-auto bg-white border-b no-scrollbar">
        {[
            {id:'stats', icon:BarChart, label:'Stats'}, {id:'profile', icon:Settings, label:'Profil'},
            {id:'privileges', icon:Gift, label:'Offres'}, {id:'notif', icon:Bell, label:'Push'},
            {id:'bookings', icon:Calendar, label:'Résa'}
        ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} className={`flex-1 min-w-[70px] py-3 text-xs font-bold flex flex-col items-center gap-1 ${tab===t.id ? 'text-[#3D9A9A] border-b-2 border-[#3D9A9A]' : 'text-gray-400'}`}>
                <t.icon size={20}/> {t.label}
            </button>
        ))}
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        {tab === 'stats' && (
            <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-2 gap-4">
                    <StatBox label="Followers" val={stats.followers} />
                    <StatBox label="Vues Profil" val={stats.views} />
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm h-64 border border-gray-100">
                    <h3 className="font-bold text-sm mb-4 text-gray-500">Activité (7j)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={(stats.history_7d || []).map((v,i)=>({name:i, val:v}))}>
                            <Line type="monotone" dataKey="val" stroke="#3D9A9A" strokeWidth={3} dot={{r:4}}/>
                            <Tooltip/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {tab === 'profile' && (
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-4 animate-in slide-in-from-right-4">
                <Input label="Nom Etablissement" val={profile.name} set={v=>setProfile({...profile, name:v})}/>
                <Input label="Catégorie" val={profile.category} set={v=>setProfile({...profile, category:v})}/>
                <textarea className="w-full p-3 border rounded-lg h-24 text-sm focus:border-[#3D9A9A] outline-none" placeholder="Description..." value={profile.description||''} onChange={e=>setProfile({...profile, description:e.target.value})}/>
                <Input label="Adresse" val={profile.address} set={v=>setProfile({...profile, address:v})}/>
                <div className="flex items-center gap-3 pt-2 bg-gray-50 p-3 rounded-lg">
                    <input type="checkbox" className="w-5 h-5 accent-[#3D9A9A]" checked={profile.booking_enabled} onChange={e=>setProfile({...profile, booking_enabled:e.target.checked})}/>
                    <span className="font-bold text-sm text-gray-700">Activer Réservations</span>
                </div>
                <button onClick={updateProfile} className="w-full bg-black text-white p-3 rounded-xl font-bold flex justify-center gap-2 mt-4 hover:bg-gray-800"><Save size={18}/> ENREGISTRER</button>
            </div>
        )}

        {tab === 'privileges' && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                    <h3 className="font-bold text-sm text-[#3D9A9A] flex items-center gap-2"><Plus size={16}/> CRÉER UNE OFFRE</h3>
                    <Input label="Titre (ex: -20% Menu)" val={newOffer.title} set={v=>setNewOffer({...newOffer, title:v})}/>
                    <div className="flex gap-2">
                        <select className="p-3 border rounded-lg bg-white text-sm" onChange={e=>setNewOffer({...newOffer, type:e.target.value})}>
                            <option value="permanent">Permanent</option>
                            <option value="flash">Flash (Stock)</option>
                        </select>
                        <Input label="Valeur (ex: -20%)" val={newOffer.value} set={v=>setNewOffer({...newOffer, value:v})}/>
                    </div>
                    <button onClick={addOffer} className="w-full bg-[#3D9A9A] text-white p-3 rounded-xl font-bold text-sm">AJOUTER</button>
                </div>

                {privileges.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 border-[#E06B7D]">
                        <div>
                            <div className="font-bold text-gray-900">{p.title}</div>
                            <div className="text-xs text-gray-500 uppercase font-bold">{p.type} • {p.discount}</div>
                        </div>
                        <button onClick={()=>deleteOffer(p.id)} className="text-red-400 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash size={18}/></button>
                    </div>
                ))}
            </div>
        )}

        {tab === 'notif' && (
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-4 animate-in slide-in-from-right-4">
                <h3 className="font-bold flex items-center gap-2 text-gray-900"><Send size={18}/> Envoyer un Push</h3>
                <Input label="Titre" val={notif.title} set={v=>setNotif({...notif, title:v})}/>
                <textarea className="w-full p-3 border rounded-lg h-24 text-sm focus:border-[#3D9A9A] outline-none" placeholder="Message..." value={notif.message} onChange={e=>setNotif({...notif, message:e.target.value})}/>
                <button onClick={sendPush} className="w-full bg-[#E06B7D] text-white p-3 rounded-xl font-bold shadow-lg hover:bg-[#d65a6c]">ENVOYER</button>
            </div>
        )}

        {tab === 'bookings' && (
            <div className="space-y-2 animate-in slide-in-from-right-4">
                {bookings.length === 0 && <div className="text-center text-gray-400 py-10">Aucune réservation.</div>}
                {bookings.map(b => (
                    <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div>
                            <div className="font-bold text-gray-800">{b.date}</div>
                            <div className="text-xs text-gray-500">{b.service} • {b.member}</div>
                        </div>
                        {b.status === 'pending' ? (
                            <div className="flex gap-1">
                                <button onClick={()=>updateBooking(b.id, 'confirmed')} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">OK</button>
                                <button onClick={()=>updateBooking(b.id, 'cancelled')} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">NON</button>
                            </div>
                        ) : <span className="text-xs font-bold uppercase text-gray-400 bg-gray-100 px-2 py-1 rounded">{b.status}</span>}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

const Input = ({label, val, set}) => <input className="w-full p-3 bg-gray-50 border rounded-lg text-sm mb-2 focus:border-[#3D9A9A] outline-none transition" placeholder={label} value={val||''} onChange={e=>set(e.target.value)}/>;
const StatBox = ({label, val}) => <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</div><div className="text-3xl font-black text-gray-900">{val}</div></div>;
