import React, { useState, useEffect } from 'react';
import { Zap, Send, Clock, Users, Plus, X } from 'lucide-react';
import Countdown from 'react-countdown';

export default function PartnerDashboard() {
  const [offers, setOffers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', discount: '-30%', slots: 5, duration_hours: 2, radius: 10 });
  const token = localStorage.getItem('token');

  const refresh = () => fetch('/api/partner/flash-offers', { headers: {'Authorization': `Bearer ${token}`} })
    .then(r=>r.json()).then(setOffers);

  useEffect(() => { refresh(); }, []);

  const create = async () => {
    await fetch('/api/partner/flash-offers', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify(form)
    });
    alert("🚀 Push Envoyé !"); setShowModal(false); refresh();
  };

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-black text-[#3D9A9A] mb-4 flex gap-2"><Zap/> Push Opportunités</h1>
      
      <button onClick={()=>setShowModal(true)} className="w-full bg-black text-white p-4 rounded-xl font-bold flex justify-center gap-2 shadow-lg mb-6">
        <Plus/> CRÉER PUSH
      </button>

      <div className="space-y-3">
        {offers.map(o => (
            <div key={o.id} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${o.active?'border-green-500':'border-gray-300'}`}>
                <div className="flex justify-between font-bold"><span>{o.title}</span><span className="text-red-500">{o.discount}</span></div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span><Users size={10} className="inline"/> {o.taken}/{o.total}</span>
                    <span><Clock size={10} className="inline"/> {o.active ? <Countdown date={o.end}/> : 'Terminé'}</span>
                </div>
            </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-sm p-6 rounded-2xl space-y-4">
                <div className="flex justify-between"><h2 className="font-bold text-lg">Nouveau Push</h2><button onClick={()=>setShowModal(false)}><X/></button></div>
                <input className="w-full p-3 border rounded" placeholder="Titre" onChange={e=>setForm({...form, title:e.target.value})}/>
                <div className="flex gap-2">
                    <input className="w-1/2 p-3 border rounded" placeholder="-30%" onChange={e=>setForm({...form, discount:e.target.value})}/>
                    <input className="w-1/2 p-3 border rounded" type="number" placeholder="Qté" onChange={e=>setForm({...form, slots:e.target.value})}/>
                </div>
                <select className="w-full p-3 border rounded" onChange={e=>setForm({...form, radius:e.target.value})}>
                    <option value="5">Rayon 5 km</option><option value="10">Rayon 10 km</option><option value="50">Région (50 km)</option>
                </select>
                <button onClick={create} className="w-full bg-red-600 text-white p-3 rounded font-bold">ENVOYER 🚀</button>
            </div>
        </div>
      )}
    </div>
  );
}
