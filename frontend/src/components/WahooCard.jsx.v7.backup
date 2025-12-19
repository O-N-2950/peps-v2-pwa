import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Zap, Calendar, Clock, Infinity } from 'lucide-react';

export default function WahooCard({ offer, onReserve, dist }) {
  const badges = {
    flash: { bg: 'bg-red-500', icon: <Zap size={10}/>, txt: 'FLASH' },
    permanent: { bg: 'bg-peps-turquoise', icon: <Infinity size={10}/>, txt: 'CLUB' },
    daily: { bg: 'bg-orange-500', icon: <Calendar size={10}/>, txt: 'DU JOUR' }
  };
  const b = badges[offer.type] || badges.permanent;

  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-white rounded-3xl shadow-lg overflow-hidden mb-4 border border-gray-100">
      <div className="h-40 relative">
        <img src={offer.partner.img} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className={`absolute top-3 right-3 text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 ${b.bg} ${offer.type==='flash'?'animate-pulse':''}`}>
            {b.icon} {b.txt}
        </div>
        <div className="absolute bottom-3 left-3 text-white">
            <h3 className="font-bold text-lg shadow-black">{offer.partner.name}</h3>
            <div className="flex items-center text-xs"><MapPin size={10}/> {dist} km</div>
        </div>
      </div>
      <div className="p-4 flex justify-between items-end">
        <div>
            <h4 className="font-bold text-gray-800">{offer.title}</h4>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">{offer.discount}</span>
            {offer.type === 'flash' && <div className="text-orange-500 text-xs font-bold mt-1 flex gap-1"><Clock size={10}/> Stock: {offer.stock}</div>}
        </div>
        <button onClick={()=>onReserve(offer)} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg">RÉSERVER</button>
      </div>
    </motion.div>
  );
}
