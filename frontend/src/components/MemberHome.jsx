import React, { useState, useEffect } from 'react';
import { User, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import WahooCard from './WahooCard'; // Assurez-vous d'avoir WahooCard.jsx
import io from 'socket.io-client';

const socket = io();

export default function MemberHome() {
  const [offers, setOffers] = useState([]);
  useEffect(() => {
    fetch('/api/offers').then(r=>r.json()).then(setOffers);
    socket.on('stock_update', (d) => {
        setOffers(prev => prev.map(o => o.id === d.id ? {...o, stock: d.new_stock} : o));
    });
    return () => socket.off('stock_update');
  }, []);

  const handleReserve = async (id) => {
    const token = localStorage.getItem('token');
    if(!token) return window.location.href = '/login';
    const res = await fetch(`/api/reserve/${id}`, { method: 'POST', headers: {'Authorization': `Bearer ${token}`} });
    if(res.ok) alert("Réservé ! 🎉");
  };

  return (
    <div className="p-4 pb-24">
        <header className="flex justify-between items-center mb-6 pt-4">
            <div><h1 className="font-black text-2xl text-peps-primary">PEP's</h1><p className="text-xs text-gray-500 flex items-center"><MapPin size={10}/> Bienne</p></div>
            <Link to="/login" className="bg-gray-100 p-2 rounded-full"><User size={20}/></Link>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
            {offers.map(o => <WahooCard key={o.id} offer={o} onReserve={handleReserve} />)}
            {offers.length === 0 && <div className="text-gray-400 text-center py-10">Aucune offre...</div>}
        </div>
    </div>
  );
}
