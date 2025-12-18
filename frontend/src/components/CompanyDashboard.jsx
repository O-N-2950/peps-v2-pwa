import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

export default function CompanyDashboard() {
  const [info, setInfo] = useState({ name: '', credits: 0 });
  const [packs, setPacks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/packs').then(r=>r.json()).then(setPacks);
    fetch('/api/company/info', { headers: { 'Authorization': `Bearer ${token}` } }).then(r=>r.json()).then(setInfo);
  }, []);

  const buy = async (id) => {
    if(!confirm("Simuler paiement Stripe ?")) return;
    const token = localStorage.getItem('token');
    const res = await fetch('/api/company/buy-pack', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ pack_id: id })
    });
    const data = await res.json();
    if(data.success) { setInfo(prev => ({...prev, credits: data.new_balance})); alert("Succès !"); }
  };

  return (
    <div className="p-6 pb-24">
      <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl mb-8">
        <h1 className="font-bold text-xl flex items-center gap-2"><Building2/> {info.name}</h1>
        <h2 className="text-gray-400 text-sm mt-2">Crédits disponibles</h2>
        <div className="text-5xl font-black">{info.credits}</div>
      </div>
      <h2 className="font-bold text-lg mb-4">Acheter des packs</h2>
      <div className="space-y-4">
        {packs.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div><h3 className="font-bold text-lg">{p.name}</h3><p className="text-sm text-gray-500">{p.credits} crédits</p></div>
                <button onClick={()=>buy(p.id)} className="bg-peps-primary text-white px-4 py-2 rounded-xl font-bold">{p.price} CHF</button>
            </div>
        ))}
      </div>
    </div>
  );
}
