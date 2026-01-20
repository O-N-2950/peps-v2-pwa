import React, { useState, useEffect } from 'react';

export default function PackageSelector() {
  const [packs, setPacks] = useState([]);
  useEffect(() => { fetch('/api/packages').then(r=>r.json()).then(setPacks) }, []);
  
  const buy = async (pid) => {
      const res = await fetch('/api/subscription/checkout', {
          method: 'POST', headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json'},
          body: JSON.stringify({ pack_id: pid })
      });
      const d = await res.json();
      if(d.url) window.location.href = d.url;
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
        {packs.map(p => (
            <div key={p.id} className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center hover:border-[#3D9A9A] transition">
                <div className="text-xs font-bold text-gray-400 uppercase">{p.category}</div>
                <h3 className="text-xl font-black text-gray-800">{p.name}</h3>
                <div className="text-3xl font-black text-[#3D9A9A] my-4">{p.price}.-</div>
                <div className="bg-gray-50 rounded-lg p-2 text-sm font-bold mb-6">{p.slots} Accès inclus</div>
                <button onClick={()=>buy(p.id)} className="w-full bg-black text-white py-3 rounded-xl font-bold">CHOISIR</button>
            </div>
        ))}
    </div>
  );
}
