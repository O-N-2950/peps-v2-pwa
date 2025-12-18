import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Zap, Clock } from 'lucide-react';

export default function WahooCard({ offer, onReserve }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative bg-white/90 backdrop-blur-md border border-white/40 rounded-3xl shadow-xl overflow-hidden cursor-pointer group w-full"
    >
      {/* Image avec Overlay */}
      <div className="h-44 relative overflow-hidden">
        <img src={offer.img || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500"} 
             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={offer.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {offer.urgent && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border border-red-400 animate-pulse">
            <Zap size={10} fill="currentColor" /> FLASH
          </div>
        )}
        
        <div className="absolute bottom-3 left-3 text-white">
          <h3 className="font-bold text-lg leading-tight shadow-black drop-shadow-md">{offer.partner}</h3>
          <div className="flex items-center text-xs opacity-90 mt-1">
             <MapPin size={12} className="mr-1 text-peps-primary" /> {offer.dist || '250m'}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{offer.title}</h4>
          <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2 py-1 rounded-lg shrink-0 ml-2">
            {offer.discount}
          </span>
        </div>
        
        <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-8">
            {offer.description || "Description générée par IA..."}
        </p>

        <div className="flex justify-between items-end border-t border-gray-100 pt-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-gray-900">{offer.price}</span>
              <span className="text-xs text-gray-400 line-through">{offer.old_price}</span>
            </div>
            {offer.stock < 3 && (
                <div className="text-[10px] font-bold text-orange-500 flex items-center gap-1 mt-1">
                   <Clock size={10} /> Vite ! Reste {offer.stock}
                </div>
            )}
          </div>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onReserve(offer.id)}
            className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-gray-900/20 hover:bg-black transition-colors"
          >
            Réserver
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
