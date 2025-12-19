import React, { useState } from 'react';
import { Save, Zap, Infinity, Sparkles } from 'lucide-react';

export default function PartnerDashboard() {
  const [form, setForm] = useState({ title: '', price: '', discount: '-20%', stock: 5, description: '', is_flash: true });
  
  const magicWrite = async () => {
    if (!form.title) return alert("Titre requis !");
    const token = localStorage.getItem('token');
    const res = await fetch('/api/ai/generate', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ context: form.title })
    });
    const data = await res.json();
    setForm({...form, description: data.text});
  };

  const submit = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/partner/create-offer', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify(form)
    });
    if(res.ok) { alert("Publié !"); setForm({...form, title: ''}); }
  };

  return (
    <div className="p-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-black mb-6">Nouvelle Offre</h1>
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button onClick={()=>setForm({...form, is_flash:true})} className={`flex-1 py-2 rounded-lg font-bold text-xs flex justify-center gap-2 ${form.is_flash?'bg-white shadow':''}`}><Zap size={14}/> FLASH</button>
        <button onClick={()=>setForm({...form, is_flash:false})} className={`flex-1 py-2 rounded-lg font-bold text-xs flex justify-center gap-2 ${!form.is_flash?'bg-white shadow':''}`}><Infinity size={14}/> PERMANENT</button>
      </div>

      <div className="space-y-4">
        <input className="w-full p-4 bg-white border border-gray-200 rounded-xl font-bold" placeholder="Titre" value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/>
        <div className="relative">
            <textarea className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm h-24" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/>
            <button onClick={magicWrite} className="absolute bottom-2 right-2 text-indigo-600 text-xs font-bold flex gap-1"><Sparkles size={12}/> IA</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <input className="p-4 bg-white border border-gray-200 rounded-xl" placeholder="Prix" value={form.price} onChange={e=>setForm({...form, price:e.target.value})}/>
            <input className="p-4 bg-white border border-gray-200 rounded-xl" placeholder="Remise" value={form.discount} onChange={e=>setForm({...form, discount:e.target.value})}/>
        </div>
        {form.is_flash && <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-xl" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})}/>}
        <button onClick={submit} className="w-full bg-black text-white p-4 rounded-xl font-bold">METTRE EN LIGNE</button>
      </div>
    </div>
  );
}
