import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Heart, Zap, Users } from 'lucide-react';

export default function WahooCard({ offer, onReserve, isFollowed }) {
  const [followed, setFollowed] = useState(isFollowed);
  const [fCount, setFCount] = useState(offer.partner.followers);

  const toggleFollow = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if(!token) return alert("Connectez-vous !");
    
    setFollowed(!followed);
    setFCount(prev => followed ? prev - 1 : prev + 1);
    
    const action = followed ? 'unfollow' : 'follow';
    await fetch(`/api/partner/${action}/${offer.partner.id}`, { method: 'POST', headers: {'Authorization': `Bearer ${token}`} });
  };

  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-white rounded-3xl shadow-lg overflow-hidden mb-4 border border-gray-100 relative">
      <div className="h-40 relative">
        <img src={offer.partner.img} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        <button onClick={toggleFollow} className="absolute top-3 right-3 bg-white/20 backdrop-blur p-2 rounded-full active:scale-90 transition">
            <Heart size={18} className={followed ? "fill-peps-pink text-peps-pink" : "text-white"} />
        </button>
        
        <div className="absolute bottom-3 left-3 text-white pr-4">
            <h3 className="font-bold text-lg shadow-black leading-none">{offer.partner.name}</h3>
            <div className="flex gap-3 text-xs mt-1 opacity-90">
                <span className="flex items-center gap-1"><Users size={10}/> {fCount}</span>
            </div>
        </div>
      </div>
      <div className="p-4 flex justify-between items-center">
        <div><h4 className="font-bold text-gray-800">{offer.title}</h4><span className="text-peps-turquoise font-black">{offer.discount}</span></div>
        <button onClick={onReserve} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-xs">RÉSERVER</button>
      </div>
    </motion.div>
  );
}
