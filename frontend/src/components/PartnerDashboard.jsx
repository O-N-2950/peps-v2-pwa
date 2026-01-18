import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Gift, Bell, BarChart, Calendar, Save, Plus, Trash, Send } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PartnerDashboard() {
  const [tab, setTab] = useState('stats');
  const [profile, setProfile] = useState({});
  const [privileges, setPrivileges] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({title: '', message: ''});
  const [newOffer, setNewOffer] = useState({title: '', type: 'permanent', value: ''});

  const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    Promise.all([
      fetch('/api/partner/profile', {headers}).then(r=>r.json()),
      fetch('/api/partner/privileges', {headers}).then(r=>r.json()),
      fetch('/api/partner/stats_advanced', {headers}).then(r=>r.json()),
      fetch('/api/partner/bookings', {headers}).then(r=>r.json())
    ]).then(([p, pr, s, b]) => {
      setProfile(p); setPrivileges(pr); setStats(s); setBookings(b);
      setLoading(false);
    });
  }, []);

  const updateProfile = async () => {
    await fetch('/api/partner/profile', {method:'PUT', headers, body: JSON.stringify(profile)});
    alert("Enregistré !");
  };

  const addOffer = async () => {
    await fetch('/api/partner/privileges', {method:'POST', headers, body: JSON.stringify(newOffer)});
    window.location.reload();
  };

  const deleteOffer = async (id) => {
    if(confirm("Supprimer ?")) { await fetch(`/api/partner/privileges?id=${id}`, {method:'DELETE', headers}); window.location.reload(); }
  };

  const sendPush = async () => {
    const res = await fetch('/api/partner/notifications', {method:'POST', headers, body: JSON.stringify(notif)});
    const d = await res.json();
    alert(`Envoyé à ${d.count} followers !`);
    setNotif({title:'', message:''});
  };

  const updateBooking = async (id, status) => {
    await fetch('/api/partner/bookings', {method:'PUT', headers, body: JSON.stringify({id, status})});
    window.location.reload();
  };

  if(loading) return <div className="p-10 text-center text-[#3D9A9A]">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-6 shadow-sm flex justify-between items-center">
        <h1 className="font-black text-xl text-[#3D9A9A] uppercase">{profile.name}</h1>
      </div>
      
      <div className="flex overflow-x-auto bg-white border-b">
        {[
            {id:'stats', icon:BarChart, label:'Stats'}, {id:'profile', icon:Settings, label:'Profil'},
            {id:'privileges', icon:Gift, label:'Offres'}, {id:'notif', icon:Bell, label:'Push'},
            {id:'bookings', icon:Calendar, label:'Résa'}
        ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 ${tab===t.id ? 'text-[#3D9A9A] border-b-2 border-[#3D9A9A]' : 'text-gray-400'}`}>
                <t.icon size={20}/> {t.label}
            </button>
        ))}
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        {tab === 'stats' && (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <StatBox label="Followers" val={stats.followers} />
                    <StatBox label="Vues" val={stats.views} />
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm h-64">
                    <h3 className="font-bold text-sm mb-4">Activité (7j)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.history_7d.map((v,i)=>({name:i, val:v}))}>
                            <Line type="monotone" dataKey="val" stroke="#3D9A9A" strokeWidth={3} dot={{r:4}}/>
                            <Tooltip/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {tab === 'profile' && (
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                <Input label="Nom" val={profile.name} set={v=>setProfile({...profile, name:v})}/>
                <Input label="Catégorie" val={profile.category} set={v=>setProfile({...profile, category:v})}/>
                <textarea className="w-full p-3 border rounded-lg h-24 text-sm" placeholder="Description" value={profile.description||''} onChange={e=>setProfile({...profile, description:e.target.value})}/>
                <Input label="Adresse" val={profile.address} set={v=>setProfile({...profile, address:v})}/>
                <Input label="Horaires (Texte)" val={profile.hours?.text} set={v=>setProfile({...profile, hours:{text:v}})}/>
                <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" checked={profile.booking_enabled} onChange={e=>setProfile({...profile, booking_enabled:e.target.checked})}/>
                    <span className="font-bold text-sm">Activer Réservations</span>
                </div>
                <button onClick={updateProfile} className="w-full bg-black text-white p-3 rounded-xl font-bold flex justify-center gap-2"><Save size={18}/> ENREGISTRER</button>
            </div>
        )}

        {tab === 'privileges' && (
            <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                    <h3 className="font-bold text-sm text-gray-400">NOUVELLE OFFRE</h3>
                    <Input label="Titre" val={newOffer.title} set={v=>setNewOffer({...newOffer, title:v})}/>
                    <div className="flex gap-2">
                        <select className="p-3 border rounded-lg bg-white" onChange={e=>setNewOffer({...newOffer, type:e.target.value})}><option value="permanent">Permanent</option><option value="flash">Flash</option></select>
                        <Input label="Valeur (-20%)" val={newOffer.value} set={v=>setNewOffer({...newOffer, value:v})}/>
                    </div>
                    <button onClick={addOffer} className="w-full bg-[#3D9A9A] text-white p-3 rounded-xl font-bold flex justify-center gap-2"><Plus size={18}/> CRÉER</button>
                </div>
                {privileges.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 border-[#E06B7D]">
                        <div><div className="font-bold">{p.title}</div><div className="text-xs text-gray-500">{p.type} • {p.discount}</div></div>
                        <button onClick={()=>deleteOffer(p.id)} className="text-red-400 p-2"><Trash size={18}/></button>
                    </div>
                ))}
            </div>
        )}

        {tab === 'notif' && (
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                <h3 className="font-bold flex items-center gap-2"><Send size={18}/> Envoyer un Push</h3>
                <Input label="Titre" val={notif.title} set={v=>setNotif({...notif, title:v})}/>
                <textarea className="w-full p-3 border rounded-lg h-24" placeholder="Message..." value={notif.message} onChange={e=>setNotif({...notif, message:e.target.value})}/>
                <button onClick={sendPush} className="w-full bg-[#E06B7D] text-white p-3 rounded-xl font-bold">ENVOYER ({stats.followers} destinataires)</button>
            </div>
        )}

        {tab === 'bookings' && (
            <div className="space-y-2">
                {bookings.map(b => (
                    <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
                        <div><div className="font-bold">{b.date}</div><div className="text-xs text-gray-500">{b.service} • {b.member}</div></div>
                        {b.status === 'pending' ? (
                            <div className="flex gap-1">
                                <button onClick={()=>updateBooking(b.id, 'confirmed')} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">OK</button>
                                <button onClick={()=>updateBooking(b.id, 'cancelled')} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">NON</button>
                            </div>
                        ) : <span className="text-xs font-bold uppercase text-gray-400">{b.status}</span>}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

const Input = ({label, val, set}) => <input className="w-full p-3 bg-gray-50 border rounded-lg text-sm mb-2" placeholder={label} value={val||''} onChange={e=>set(e.target.value)}/>;
const StatBox = ({label, val}) => <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-gray-400 text-xs font-bold uppercase">{label}</div><div className="text-3xl font-black text-gray-900">{val}</div></div>;
