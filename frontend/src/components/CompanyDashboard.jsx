import React, { useState, useEffect } from 'react';
import { Users, Building2, Plus } from 'lucide-react';

export default function CompanyDashboard() {
  const [data, setData] = useState(null);
  const [newEmail, setNewEmail] = useState('');

  const loadData = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/company/info', { headers: {'Authorization': `Bearer ${token}`} });
    if(res.ok) setData(await res.json());
  };

  useEffect(() => { loadData(); }, []);

  const addMember = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/company/add-member', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ email: newEmail })
    });
    const d = await res.json();
    if(d.success) { alert(d.msg); setNewEmail(''); loadData(); }
    else alert(d.error);
  };

  if(!data) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="p-6 pb-24">
      <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl mb-6">
        <h1 className="font-bold text-xl flex items-center gap-2"><Building2/> {data.name}</h1>
        <div className="mt-4">
            <p className="text-sm text-gray-400">Places utilisées</p>
            <p className="text-3xl font-black">{data.used} / {data.total}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold mb-2 flex items-center gap-2"><Plus size={18}/> Ajouter un membre</h3>
        <div className="flex gap-2">
            <input className="flex-1 p-3 bg-gray-50 rounded-xl text-sm" placeholder="email@employe.com" value={newEmail} onChange={e=>setNewEmail(e.target.value)}/>
            <button onClick={addMember} className="bg-peps-primary text-white p-3 rounded-xl font-bold">OK</button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">Mot de passe par défaut : welcome123</p>
      </div>

      <h3 className="font-bold mb-2 flex items-center gap-2"><Users size={18}/> Membres Actifs</h3>
      <div className="space-y-2">
        {data.members.map((m, i) => (
            <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between">
                <span className="text-sm">{m.email}</span>
                <span className="text-green-600 text-[10px] font-bold">ACTIF</span>
            </div>
        ))}
      </div>
    </div>
  );
}
