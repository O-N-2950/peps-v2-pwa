import React, { useState } from 'react';
import { Save } from 'lucide-react';
import AiButton from './AiButton'; // Assurez-vous d'avoir créé AiButton.jsx précédemment

export default function PartnerDashboard() {
  const [form, setForm] = useState({ title: '', price: '', old_price: '', discount: '-20%', stock: 5, description: '' });
  const [loadingAI, setLoadingAI] = useState(false);

  const generateAI = async () => {
    if (!form.title) return alert("Titre requis !");
    setLoadingAI(true);
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/ai/generate', {
            method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ context: form.title })
        });
        const data = await res.json();
        setForm({...form, description: data.text});
    } catch(e) {}
    setLoadingAI(false);
  };

  const submitOffer = async () => {
    const token = localStorage.getItem('token');
    await fetch('/api/partner/create-offer', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify(form)
    });
    alert("Offre publiée !");
    setForm({ title: '', price: '', old_price: '', discount: '-20%', stock: 5, description: '' });
  };

  return (
    <div className="p-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Créer une Offre ⚡</h1>
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4">
        <input className="w-full p-4 bg-gray-50 rounded-xl font-bold" placeholder="Titre (ex: Reste 3 Sushis)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <div className="flex gap-2 items-start">
            <textarea className="w-full p-4 bg-gray-50 rounded-xl text-sm h-28 resize-none" placeholder="Description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </div>
        <AiButton onClick={generateAI} loading={loadingAI} />
        <div className="grid grid-cols-2 gap-4">
            <input className="p-4 bg-gray-50 rounded-xl" placeholder="Prix (20.-)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            <input className="p-4 bg-gray-50 rounded-xl" placeholder="Stock (5)" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
        </div>
        <button onClick={submitOffer} className="w-full bg-peps-primary text-white font-bold p-4 rounded-xl shadow-lg flex justify-center gap-2"><Save size={18} /> PUBLIER</button>
      </div>
    </div>
  );
}
