import React, { useState, useEffect } from 'react';
import { Building2, Users, UserPlus, Trash } from 'lucide-react';

export default function CompanyDashboard() {
  const [overview, setOverview] = useState({});
  const [employees, setEmployees] = useState([]);
  const [email, setEmail] = useState('');
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };

  const load = () => {
    fetch('/api/company/overview', {headers}).then(r=>r.json()).then(setOverview);
    fetch('/api/company/employees', {headers}).then(r=>r.json()).then(setEmployees);
  };
  useEffect(load, []);

  const add = async () => {
    const res = await fetch('/api/company/employees', {method:'POST', headers, body: JSON.stringify({email})});
    if(res.ok) { setEmail(''); load(); } else alert("Erreur");
  };

  const remove = async (id) => {
    if(confirm("Retirer ?")) { await fetch(`/api/company/employees?id=${id}`, {method:'DELETE', headers}); load(); }
  };

  if(!overview.name) return <div>Chargement...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen pb-24">
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border-l-4 border-[#3D9A9A]">
            <h1 className="font-black text-xl flex items-center gap-2"><Building2/> {overview.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{overview.slots_used} / {overview.slots_total} Licences utilisées</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex gap-2">
            <input className="flex-1 p-3 bg-gray-50 rounded-lg border" placeholder="Email..." value={email} onChange={e=>setEmail(e.target.value)}/>
            <button onClick={add} className="bg-black text-white p-3 rounded-lg"><UserPlus/></button>
        </div>
        <div className="space-y-2">
            {employees.map(e => (
                <div key={e.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                    <span className="font-bold text-sm">{e.email}</span>
                    <button onClick={()=>remove(e.id)} className="text-red-400"><Trash size={18}/></button>
                </div>
            ))}
        </div>
    </div>
  );
}
