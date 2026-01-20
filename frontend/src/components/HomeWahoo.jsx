import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { motion } from 'framer-motion';
import { MapPin, Users, Building2, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomeWahoo() {
  const { currency, switchCurrency } = useCurrency();
  const [packs, setPacks] = useState({});
  const [cat, setCat] = useState('B2C');

  useEffect(() => {
    fetch(`/api/packs?currency=${currency}`).then(r=>r.json()).then(setPacks);
  }, [currency]);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <div className="fixed top-0 w-full p-6 flex justify-between items-center z-50 bg-white/90 backdrop-blur">
        <div className="font-black text-2xl text-[#3D9A9A]">PEP's</div>
        <div className="flex bg-gray-100 rounded-full p-1">
            {['CHF', 'EUR'].map(c => (
                <button key={c} onClick={()=>switchCurrency(c)} className={`px-4 py-1 rounded-full text-xs font-bold ${currency===c?'bg-[#3D9A9A] text-white':'text-gray-500'}`}>{c}</button>
            ))}
        </div>
      </div>

      <div className="pt-32 pb-20 px-6 bg-[#1F2937] text-white text-center">
        <motion.h1 initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="text-5xl md:text-8xl font-black mb-6">
            L'économie <span className="text-[#3D9A9A]">Locale</span>
        </motion.h1>
        <Link to="/map" className="bg-[#3D9A9A] px-8 py-4 rounded-full font-bold shadow-lg inline-flex items-center gap-2"><MapPin/> EXPLORER</Link>
      </div>

      <div className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-center gap-4 mb-12">
                {['B2C', 'PME', 'CORP'].map(c => (
                    <button key={c} onClick={()=>setCat(c)} className={`px-6 py-2 rounded-full font-bold ${cat===c?'bg-black text-white':'bg-white text-gray-500 border'}`}>{c}</button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {packs[cat]?.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm hover:border-[#3D9A9A] border-2 border-transparent transition">
                        <h3 className="font-black text-xl">{p.name}</h3>
                        <div className="text-3xl font-black text-[#3D9A9A] my-2">{p.price} {currency}</div>
                        <div className="text-xs font-bold text-gray-400 mb-4">{p.slots} ACCÈS</div>
                        <Link to={`/register?pack=${p.id}&curr=${currency}`} className="block w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-center">CHOISIR</Link>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
