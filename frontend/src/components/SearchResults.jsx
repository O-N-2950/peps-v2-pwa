import React from 'react';
import { Zap } from 'lucide-react';

export default function SearchResults({ results, onAction }) {
  if (results.length === 0) return <div className="p-8 text-center text-gray-400">Aucun résultat.</div>;
  return (
    <div className="space-y-3">
      {results.map(p => (
        <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm flex gap-4 relative overflow-hidden">
          <img src={p.img} className="w-16 h-16 rounded-lg object-cover bg-gray-200"/>
          <div className="flex-1">
             <h3 className="font-bold text-gray-800">{p.name}</h3>
             <div className="text-xs text-gray-500">{p.category} • {p.city || 'Suisse'}</div>
             <div className="text-xs font-bold text-[#3D9A9A] mt-1">{p.offer_count} Offres</div>
          </div>
          <button onClick={()=>onAction(p.id)} className="absolute bottom-4 right-4 bg-black text-white p-2 rounded-full shadow-lg active:scale-90 transition">
            <Zap size={16} fill="currentColor" className="text-yellow-400"/>
          </button>
        </div>
      ))}
    </div>
  );
}
