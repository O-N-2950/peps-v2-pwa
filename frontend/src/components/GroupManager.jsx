import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GroupManager() {
  const [data, setData] = useState({ slots: [] });
  const [email, setEmail] = useState('');
  
  const load = () => fetch('/api/group/manage', { headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`} })
    .then(r=>r.json()).then(setData);

  useEffect(() => { load(); }, []);

  const invite = async () => {
    if(!email) return;
    const res = await fetch('/api/group/invite', { method: 'POST', headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json'}, body: JSON.stringify({ email }) });
    const d = await res.json();
    if (d.success) {
        prompt("Lien d'invitation (Copier):", d.link);
        setEmail(''); load();
    } else toast.error(d.error);
  };

  const revoke = async (id) => {
      if(!confirm("Retirer ce membre ?")) return;
      await fetch('/api/group/revoke', { method: 'POST', headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json'}, body: JSON.stringify({ slot_id: id }) });
      load();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Users className="text-[#3D9A9A]"/> Mon Groupe ({data.pack_name})</h2>
      
      <div className="flex gap-2 mb-6">
          <input className="flex-1 p-3 border rounded-lg bg-gray-50 text-sm" placeholder="Email invité..." value={email} onChange={e=>setEmail(e.target.value)}/>
          <button onClick={invite} className="bg-black text-white px-4 rounded-lg font-bold text-xs flex items-center gap-2"><UserPlus size={16}/> INVITER</button>
      </div>

      <div className="space-y-3">
          {data.slots.map((s, i) => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                      <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-gray-500">{i+1}</div>
                      <div>
                          {s.is_me && <span className="text-[10px] bg-[#3D9A9A] text-white px-1.5 py-0.5 rounded font-bold mr-2">VOUS</span>}
                          <span className="font-bold text-sm text-gray-800">{s.user || (s.email ? `Invité: ${s.email}` : "Disponible")}</span>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">{s.status}</div>
                      </div>
                  </div>
                  {!s.is_me && s.status !== 'empty' && (
                      <button onClick={()=>revoke(s.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button>
                  )}
              </div>
          ))}
      </div>
    </div>
  );
}
