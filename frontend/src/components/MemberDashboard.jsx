import React, { useState, useEffect } from 'react';
import { User, Calendar, Save, Heart, LogOut } from 'lucide-react';

export default function MemberDashboard() {
  const [profile, setProfile] = useState({});
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch('/api/member/profile', {headers}).then(r=>r.json()).then(setProfile);
    fetch('/api/member/bookings', {headers}).then(r=>r.json()).then(setBookings);
    fetch('/api/member/favorites', {headers}).then(r=>r.json()).then(setFavorites);
  }, []);

  const save = async () => {
    await fetch('/api/member/profile', {method:'PUT', headers, body: JSON.stringify(profile)});
    alert("Mis à jour !");
  };

  if(!profile.email) return <div>...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen pb-24">
      <h1 className="text-2xl font-black text-[#3D9A9A] mb-6">Mon Compte</h1>
      
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><User size={18}/> Infos</h3>
        <div className="grid grid-cols-2 gap-2">
            <input className="p-2 border rounded text-sm" placeholder="Prénom" value={profile.first_name||''} onChange={e=>setProfile({...profile, first_name:e.target.value})}/>
            <input className="p-2 border rounded text-sm" placeholder="Nom" value={profile.last_name||''} onChange={e=>setProfile({...profile, last_name:e.target.value})}/>
        </div>
        <input className="w-full p-2 border rounded text-sm" placeholder="Téléphone" value={profile.phone||''} onChange={e=>setProfile({...profile, phone:e.target.value})}/>
        <div className={`text-xs font-bold p-2 rounded text-center ${profile.active?'bg-green-100 text-green-700':'bg-red-100'}`}>{profile.active?'ABONNEMENT ACTIF':'INACTIF'}</div>
        <button onClick={save} className="w-full bg-black text-white py-2 rounded font-bold text-xs flex justify-center gap-2"><Save size={14}/> SAUVEGARDER</button>
      </div>

      <h3 className="font-bold mb-3 flex items-center gap-2"><Heart size={18}/> Mes Favoris</h3>
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {favorites.map(f => (
              <div key={f.id} className="min-w-[80px] text-center bg-white p-2 rounded-xl shadow-sm">
                  <img src={f.image_url} className="w-12 h-12 rounded-full mx-auto object-cover mb-1"/>
                  <div className="text-[10px] font-bold truncate">{f.name}</div>
              </div>
          ))}
          {favorites.length===0 && <p className="text-gray-400 text-xs">Aucun favori.</p>}
      </div>

      <h3 className="font-bold mb-3 flex items-center gap-2 mt-4"><Calendar size={18}/> Mes RDV</h3>
      <div className="space-y-2">
          {bookings.map(b => (
              <div key={b.id} className="bg-white p-3 rounded-xl border flex justify-between text-xs">
                  <div><div className="font-bold">{b.partner}</div><div>{b.date}</div></div>
                  <span className="font-bold text-[#3D9A9A]">{b.status}</span>
              </div>
          ))}
      </div>
      
      <button onClick={()=>{localStorage.clear(); window.location.href='/login'}} className="mt-8 w-full border-2 border-red-100 text-red-400 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><LogOut size={16}/> DÉCONNEXION</button>
    </div>
  );
}
