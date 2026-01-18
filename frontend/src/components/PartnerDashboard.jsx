import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Gift, Calendar, Settings, Save, Plus, LogOut } from 'lucide-react';

export default function PartnerDashboard() {
  const [tab, setTab] = useState('profil');
  const [profile, setProfile] = useState({});
  const [offers, setOffers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${token}` };
    Promise.all([
      fetch('/api/partner/profile', { headers }).then(r => r.json()),
      fetch('/api/partner/offers', { headers }).then(r => r.json()),
      fetch('/api/partner/bookings', { headers }).then(r => r.json())
    ]).then(([p, o, b]) => {
      if(p.error) throw new Error(p.error);
      setProfile(p); setOffers(o||[]); setBookings(b||[]); setLoading(false);
    }).catch(e => { console.error(e); setLoading(false); });
  }, []);

  const saveProfile = async () => {
    await fetch('/api/partner/profile', {
      method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    alert("Profil mis à jour");
  };

  const createOffer = async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    await fetch('/api/partner/offers', {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(d))
    });
    alert("Offre créée"); window.location.reload();
  };

  if (loading) return <div className="p-10 text-center">Chargement V14...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-[#3D9A9A] text-white p-6 flex justify-between items-center">
        <h1 className="font-black text-xl">{profile.name}</h1>
        <button onClick={()=>{localStorage.clear(); window.location.href='/login'}}><LogOut size={20}/></button>
      </header>

      <div className="flex bg-white border-b p-2 gap-4 overflow-x-auto">
        {[{id:'profil', icon:Settings}, {id:'offers', icon:Gift}, {id:'agenda', icon:Calendar}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} className={`p-2 ${tab===t.id?'text-[#3D9A9A] font-bold':'text-gray-400'}`}>
             <t.icon size={24} className="mx-auto"/> <span className="text-[10px] uppercase">{t.id}</span>
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'profil' && (
            <div className="space-y-4 bg-white p-6 rounded-xl shadow-sm">
                <input className="w-full p-3 border rounded" value={profile.name||''} onChange={e=>setProfile({...profile, name:e.target.value})} placeholder="Nom"/>
                <input className="w-full p-3 border rounded" value={profile.phone||''} onChange={e=>setProfile({...profile, phone:e.target.value})} placeholder="Téléphone"/>
                <button onClick={saveProfile} className="w-full bg-black text-white p-3 rounded font-bold">SAUVEGARDER</button>
            </div>
        )}

        {tab === 'offers' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="font-bold mb-4">Nouvelle Offre</h3>
                    <form onSubmit={createOffer} className="space-y-3">
                        <input name="title" className="w-full p-3 border rounded" placeholder="Titre" required/>
                        <select name="type" className="w-full p-3 border rounded">
                            <option value="permanent">Privilège Permanent</option>
                            <option value="flash">Offre Flash</option>
                            <option value="daily">Menu du Jour</option>
                        </select>
                        <input name="value" className="w-full p-3 border rounded" placeholder="Valeur (-20%)" required/>
                        <button className="w-full bg-[#3D9A9A] text-white p-3 rounded font-bold">AJOUTER</button>
                    </form>
                </div>
                {offers.map(o => (
                    <div key={o.id} className="bg-white p-4 rounded border-l-4 border-[#3D9A9A] shadow-sm">
                        <div className="font-bold">{o.title}</div>
                        <div className="text-xs text-gray-500 uppercase">{o.type} • {o.value}</div>
                    </div>
                ))}
            </div>
        )}

        {tab === 'agenda' && (
            <div className="space-y-4">
                <div className="bg-white p-4 rounded shadow-sm text-center">
                    <Calendar className="mx-auto text-[#3D9A9A] mb-2"/>
                    <h3 className="font-bold">Réservations</h3>
                </div>
                {bookings.map(b => (
                    <div key={b.id} className="bg-white p-4 rounded border shadow-sm flex justify-between">
                        <div><div className="font-bold">{b.client}</div><div className="text-xs text-gray-500">{b.date} à {b.time}</div></div>
                        <span className="text-green-600 font-bold text-xs">{b.status}</span>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
