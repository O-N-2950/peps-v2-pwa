import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export default function MemberDashboard() {
  const [partners, setPartners] = useState([]);
  useEffect(() => { fetch('/api/partners/search').then(r=>r.json()).then(setPartners) }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Explorer</h1>
      <div className="bg-white p-2 rounded-xl shadow-sm flex items-center gap-2 mb-6">
        <Search className="text-gray-400 ml-2"/>
        <input className="w-full p-2 outline-none" placeholder="Recherche..." onChange={e=>fetch(`/api/partners/search?q=${e.target.value}`).then(r=>r.json()).then(setPartners)}/>
      </div>
      <div className="space-y-4">
        {partners.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                <div><div className="font-bold">{p.name}</div><div className="text-xs text-gray-500">{p.category}</div></div>
                <button className="bg-black text-white px-3 py-1 rounded text-xs font-bold">VOIR</button>
            </div>
        ))}
      </div>
    </div>
  );
}
