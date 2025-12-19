import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map } from 'lucide-react';
import WahooCard from './WahooCard';

export default function MemberHome() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const h = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('/api/offers', { headers: h }).then(r=>r.json()).then(setOffers);
  }, []);

  const favorites = offers.filter(o => o.is_followed);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white sticky top-0 z-20 px-4 py-3 shadow-sm flex justify-between items-center">
         <h1 className="font-black text-2xl text-peps-turquoise">PEP's</h1>
         <Link to="/map" className="bg-gray-100 p-2 rounded-full"><Map size={20}/></Link>
      </div>

      {/* FAVORIS */}
      {favorites.length > 0 && (
          <div className="px-4 py-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vos Favoris</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {favorites.map(o => (
                      <div key={o.id} className="min-w-[70px] text-center">
                          <img src={o.partner.img} className="w-14 h-14 rounded-full border-2 border-peps-turquoise object-cover mx-auto p-0.5" />
                          <p className="text-[10px] font-bold mt-1 truncate">{o.partner.name}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="px-4 space-y-4 mt-2">
         {offers.map(o => <WahooCard key={o.id} offer={o} isFollowed={o.is_followed} onReserve={()=>{}} />)}
      </div>
    </div>
  );
}
