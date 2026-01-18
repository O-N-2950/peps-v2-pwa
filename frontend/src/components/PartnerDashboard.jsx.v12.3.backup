import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Gift, Bell, BarChart, Calendar, Save, Plus, Trash, Send, LogOut } from 'lucide-react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function PartnerDashboard() {
  const [tab, setTab] = useState('stats');
  const [profile, setProfile] = useState({ name: 'Chargement...' });
  const [privileges, setPrivileges] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ followers: 0, views: 0, history_7d: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newOffer, setNewOffer] = useState({title: '', type: 'permanent', value: ''});
  const [notif, setNotif] = useState({title: '', message: ''});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const h = { 'Authorization': `Bearer ${token}` };
        
        const fetchSafe = (url) => fetch(url, {headers: h}).then(r => r.ok ? r.json() : null).catch(()=>null);

        try {
            const pRes = await fetch('/api/partner/profile', {headers: h});
            if (pRes.status === 401) throw new Error("Session expirée");
            if (!pRes.ok) throw new Error("Erreur Profil");
            setProfile(await pRes.json());

            const [pr, s, b] = await Promise.all([
                fetchSafe('/api/partner/privileges'),
                fetchSafe('/api/partner/stats_advanced'),
                fetchSafe('/api/partner/bookings')
            ]);
            
            setPrivileges(pr || []);
            setStats(s || { followers: 0, views: 0, history_7d: [] });
            setBookings(b || []);
        } catch (e) {
            setError(e.message);
            if (e.message === "Session expirée") { localStorage.clear(); navigate('/login'); }
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [navigate]);

  const updateProfile = async () => {
      const h = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
      await fetch('/api/partner/profile', {method:'PUT', headers:h, body: JSON.stringify(profile)});
      alert("Enregistré !");
  };

  const addOffer = async () => {
      const h = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
      await fetch('/api/partner/privileges', {method:'POST', headers:h, body: JSON.stringify(newOffer)});
      window.location.reload();
  };

  const deleteOffer = async (id) => {
      if(confirm("Supprimer ?")) { await fetch(`/api/partner/privileges?id=${id}`, {method:'DELETE', headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}}); window.location.reload(); }
  };

  const sendPush = async () => {
      const h = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
      await fetch('/api/partner/notifications', {method:'POST', headers:h, body: JSON.stringify(notif)});
      alert("Envoyé !"); setNotif({title:'', message:''});
  };

  const updateBooking = async (id, status) => {
      const h = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
      await fetch('/api/partner/bookings', {method:'PUT', headers:h, body: JSON.stringify({id, status})});
      window.location.reload();
  };

  if(loading) return <div className="p-10 text-center text-[#3D9A9A]">Chargement...</div>;
  if(error) return <div className="p-10 text-center text-red-500">Erreur: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white p-6 shadow-sm flex justify-between items-center sticky top-0 z-10">
            <h1 className="font-black text-xl text-[#3D9A9A] uppercase">{profile.name}</h1>
            <button onClick={()=>{localStorage.clear(); navigate('/login')}}><LogOut size={20} className="text-red-400"/></button>
        </div>
        
        <div className="flex overflow-x-auto bg-white border-b no-scrollbar">
            {[{id:'stats', icon:BarChart}, {id:'profile', icon:Settings}, {id:'privileges', icon:Gift}, {id:'notif', icon:Bell}, {id:'bookings', icon:Calendar}].map(t => 
                <button key={t.id} onClick={()=>setTab(t.id)} className={`flex-1 py-3 min-w-[70px] flex flex-col items-center gap-1 text-xs font-bold ${tab===t.id ? 'text-[#3D9A9A] border-b-2 border-[#3D9A9A]' : 'text-gray-400'}`}><t.icon size={20}/>{t.id}</button>
            )}
        </div>

        <div className="p-4">
            {tab==='stats' && <div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="bg-white p-4 rounded shadow text-center"><div className="text-gray-400 text-xs">FOLLOWERS</div><div className="text-3xl font-black">{stats.followers}</div></div><div className="bg-white p-4 rounded shadow text-center"><div className="text-gray-400 text-xs">VUES</div><div className="text-3xl font-black">{stats.views}</div></div></div><div className="bg-white p-4 rounded shadow h-48"><ResponsiveContainer><LineChart data={(stats.history_7d||[]).map((v,i)=>({i,v}))}><Line type="monotone" dataKey="v" stroke="#3D9A9A"/></LineChart></ResponsiveContainer></div></div>}
            {tab==='profile' && <div className="space-y-4 bg-white p-6 rounded shadow"><input className="w-full p-3 border rounded" value={profile.name||''} onChange={e=>setProfile({...profile, name:e.target.value})}/><textarea className="w-full p-3 border rounded h-24" value={profile.description||''} onChange={e=>setProfile({...profile, description:e.target.value})}/><button onClick={updateProfile} className="w-full bg-black text-white p-3 rounded font-bold">ENREGISTRER</button></div>}
            {tab==='privileges' && <div className="space-y-4"><div className="bg-white p-4 rounded border"><input className="w-full p-2 border rounded mb-2" placeholder="Titre" value={newOffer.title} onChange={e=>setNewOffer({...newOffer, title:e.target.value})}/><button onClick={addOffer} className="w-full bg-[#3D9A9A] text-white p-2 rounded font-bold">Ajouter</button></div>{privileges.map(p=><div key={p.id} className="bg-white p-4 rounded shadow flex justify-between"><b>{p.title}</b><button onClick={()=>deleteOffer(p.id)}><Trash size={16} className="text-red-400"/></button></div>)}</div>}
            {tab==='notif' && <div className="space-y-4 bg-white p-4 rounded shadow"><input className="w-full p-2 border rounded" placeholder="Titre" onChange={e=>setNotif({...notif, title:e.target.value})}/><textarea className="w-full p-2 border rounded h-20" placeholder="Message" onChange={e=>setNotif({...notif, message:e.target.value})}/><button onClick={sendPush} className="w-full bg-pink-500 text-white p-2 rounded font-bold">ENVOYER</button></div>}
            {tab==='bookings' && <div className="space-y-2">{bookings.map(b=><div key={b.id} className="bg-white p-4 rounded shadow flex justify-between"><div><b>{b.date}</b><br/>{b.member}</div><span className="bg-gray-100 px-2 py-1 rounded text-xs">{b.status}</span></div>)}</div>}
        </div>
    </div>
  );
}
