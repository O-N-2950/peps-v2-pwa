import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Gift, Bell, BarChart, Calendar, Save, Plus, Trash, Send, LogOut, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function PartnerDashboard() {
  const [tab, setTab] = useState('stats');
  const [profile, setProfile] = useState({ name: 'Chargement...', category: '' });
  const [privileges, setPrivileges] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ followers: 0, views: 0, history_7d: [] });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [notif, setNotif] = useState({title: '', message: ''});
  const [newOffer, setNewOffer] = useState({title: '', type: 'permanent', value: ''});

  const navigate = useNavigate();

  useEffect(() => {
    const initDashboard = async () => {
        console.log("🚀 DÉMARRAGE DASHBOARD PARTNER V12.2");
        
        const token = localStorage.getItem('token');
        console.log("🔑 Token présent ?", !!token);

        if (!token) { 
            console.warn("🔴 Pas de token, redirection...");
            window.location.href = '/login'; 
            return; 
        }
        
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        
        // Fonction Fetch "Verbeuse"
        const fetchLog = async (url) => {
            console.log(`📡 Fetching: ${url}`);
            const res = await fetch(url, {headers});
            console.log(`📥 Status ${url}:`, res.status);
            
            if (res.status === 401) throw new Error("Session expirée (401) - Reconnectez-vous");
            if (res.status === 403) throw new Error("Accès refusé (403) - Rôle incorrect");
            if (res.status === 404) throw new Error("Profil introuvable (404) - API Manquante ?");
            if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
            
            return await res.json();
        };

        try {
            // 1. PROFIL (CRITIQUE : Si ça rate, on arrête)
            const p = await fetchLog('/api/partner/profile');
            setProfile(p);

            // 2. DONNÉES SECONDAIRES (On essaie, mais on ne crash pas tout si ça rate)
            try {
                const [pr, s, b] = await Promise.all([
                    fetchLog('/api/partner/privileges'),
                    fetchLog('/api/partner/stats_advanced'),
                    fetchLog('/api/partner/bookings')
                ]);
                setPrivileges(pr || []);
                setStats(s || { followers: 0, views: 0, history_7d: [] });
                setBookings(b || []);
            } catch (secErr) {
                console.warn("⚠️ Erreur partielle (données secondaires):", secErr);
            }

        } catch (err) {
            console.error("🚨 ERREUR FATALE DASHBOARD:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    initDashboard();
  }, [navigate]);

  // ... Actions (updateProfile, addOffer, etc.) identiques à avant ...
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
    if(confirm("Supprimer ?")) { await fetch(`/api/partner/privileges?id=${id}`, {method:'DELETE', headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}}); window.location.reload(); }
  };
  const sendPush = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/partner/notifications', {method:'POST', headers, body: JSON.stringify(notif)});
    alert(`Envoyé !`); setNotif({title:'', message:''});
  };
  const updateBooking = async (id, status) => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
    await fetch('/api/partner/bookings', {method:'PUT', headers, body: JSON.stringify({id, status})});
    window.location.reload();
  };

  if (error) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
          <AlertCircle size={48} className="text-red-500 mb-4"/>
          <h2 className="text-red-600 font-bold text-xl mb-2">Erreur de Chargement</h2>
          <p className="text-gray-800 font-mono bg-white p-4 rounded border border-red-200 mb-6">{error}</p>
          <button onClick={()=>{localStorage.clear(); window.location.href='/login'}} className="bg-black text-white px-6 py-3 rounded-xl font-bold shadow hover:scale-105 transition">Se reconnecter</button>
          <p className="text-xs text-gray-400 mt-4">Cela nettoiera votre session locale.</p>
      </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#3D9A9A] font-bold animate-pulse">Chargement Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-6 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div><h1 className="font-black text-xl text-[#3D9A9A] uppercase truncate max-w-[200px]">{profile.name}</h1><p className="text-xs text-gray-400">{profile.category}</p></div>
        <button onClick={()=>{localStorage.clear(); window.location.href='/login'}} className="text-red-400 bg-red-50 p-2 rounded-full"><LogOut size={18}/></button>
      </div>
      <div className="flex overflow-x-auto bg-white border-b no-scrollbar">
        {[{id:'stats', icon:BarChart, label:'Stats'}, {id:'profile', icon:Settings, label:'Profil'}, {id:'privileges', icon:Gift, label:'Offres'}, {id:'notif', icon:Bell, label:'Push'}, {id:'bookings', icon:Calendar, label:'Résa'}]
          .map(t => <button key={t.id} onClick={()=>setTab(t.id)} className={`flex-1 min-w-[70px] py-3 text-xs font-bold flex flex-col items-center gap-1 ${tab===t.id ? 'text-[#3D9A9A] border-b-2 border-[#3D9A9A]' : 'text-gray-400'}`}><t.icon size={20}/> {t.label}</button>)}
      </div>
      <div className="p-4 max-w-3xl mx-auto animate-in fade-in">
        {tab === 'stats' && <div className="space-y-4"><div className="grid grid-cols-2 gap-4"><StatBox label="Followers" val={stats.followers}/><StatBox label="Vues" val={stats.views}/></div><div className="bg-white p-4 rounded-xl shadow-sm h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={(stats.history_7d||[]).map((v,i)=>({name:i, val:v}))}><Line type="monotone" dataKey="val" stroke="#3D9A9A" strokeWidth={3} dot={{r:4}}/><Tooltip/></LineChart></ResponsiveContainer></div></div>}
        {tab === 'profile' && <div className="bg-white p-6 rounded-xl shadow-sm space-y-4"><Input label="Nom" val={profile.name} set={v=>setProfile({...profile, name:v})}/><Input label="Catégorie" val={profile.category} set={v=>setProfile({...profile, category:v})}/><textarea className="w-full p-3 border rounded-lg h-24 text-sm outline-none" value={profile.description||''} onChange={e=>setProfile({...profile, description:e.target.value})}/><Input label="Adresse" val={profile.address} set={v=>setProfile({...profile, address:v})}/><div className="flex items-center gap-3"><input type="checkbox" checked={profile.booking_enabled} onChange={e=>setProfile({...profile, booking_enabled:e.target.checked})}/><span className="font-bold text-sm">Activer Réservations</span></div><button onClick={updateProfile} className="w-full bg-black text-white p-3 rounded-xl font-bold"><Save size={18}/> ENREGISTRER</button></div>}
        {tab === 'privileges' && <div className="space-y-4"><div className="bg-white p-4 rounded-xl border shadow-sm space-y-3"><h3 className="font-bold text-sm text-[#3D9A9A]">NOUVELLE OFFRE</h3><Input label="Titre" val={newOffer.title} set={v=>setNewOffer({...newOffer, title:v})}/><div className="flex gap-2"><select className="p-3 border rounded-lg bg-white text-sm" onChange={e=>setNewOffer({...newOffer, type:e.target.value})}><option value="permanent">Permanent</option><option value="flash">Flash</option></select><Input label="Valeur" val={newOffer.value} set={v=>setNewOffer({...newOffer, value:v})}/></div><button onClick={addOffer} className="w-full bg-[#3D9A9A] text-white p-3 rounded-xl font-bold text-sm">AJOUTER</button></div>{privileges.map(p => <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-[#E06B7D] flex justify-between"><div><div className="font-bold">{p.title}</div><div className="text-xs text-gray-500">{p.type}</div></div><button onClick={()=>deleteOffer(p.id)} className="text-red-400"><Trash size={18}/></button></div>)}</div>}
        {tab === 'notif' && <div className="bg-white p-6 rounded-xl shadow-sm space-y-4"><h3 className="font-bold flex items-center gap-2"><Send size={18}/> Envoyer un Push</h3><Input label="Titre" val={notif.title} set={v=>setNotif({...notif, title:v})}/><textarea className="w-full p-3 border rounded-lg h-24" value={notif.message} onChange={e=>setNotif({...notif, message:e.target.value})}/><button onClick={sendPush} className="w-full bg-[#E06B7D] text-white p-3 rounded-xl font-bold">ENVOYER</button></div>}
        {tab === 'bookings' && <div className="space-y-2">{bookings.map(b => <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between"><div><div className="font-bold">{b.date}</div><div className="text-xs text-gray-500">{b.service}</div></div><span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">{b.status}</span></div>)}</div>}
      </div>
    </div>
  );
}

const Input = ({label, val, set}) => <input className="w-full p-3 bg-gray-50 border rounded-lg text-sm mb-2 outline-none" placeholder={label} value={val||''} onChange={e=>set(e.target.value)}/>;
const StatBox = ({label, val}) => <div className="bg-white p-4 rounded-xl shadow-sm border text-center"><div className="text-gray-400 text-[10px] font-bold uppercase">{label}</div><div className="text-3xl font-black text-gray-900">{val}</div></div>;
