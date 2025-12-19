import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ValidationScreen({ offer, onClose }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // 1. Confettis
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    // 2. Horloge Temps Réel
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-peps-primary flex flex-col items-center justify-center text-white p-6">
      <button onClick={onClose} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full"><X size={20}/></button>
      
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }} 
        transition={{ repeat: Infinity, duration: 2 }}
        className="bg-white/20 p-6 rounded-full mb-6"
      >
        <CheckCircle size={64} className="text-white" />
      </motion.div>

      <h1 className="text-3xl font-black text-center mb-2">OFFRE VALIDÉE</h1>
      <h2 className="text-xl font-bold text-peps-dark mb-8">{offer?.title}</h2>

      {/* HORLOGE ANTI-FRAUDE */}
      <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 text-center w-full max-w-xs">
        <div className="flex justify-center items-center gap-2 opacity-80 mb-2 uppercase text-xs tracking-widest">
            <Clock size={14}/> Heure Actuelle
        </div>
        <div className="text-5xl font-mono font-black tabular-nums">
            {time.toLocaleTimeString()}
        </div>
        <div className="mt-2 text-sm font-bold">{time.toLocaleDateString()}</div>
      </div>

      <p className="mt-8 text-xs opacity-70">Montrez cet écran au personnel</p>
    </div>
  );
}
