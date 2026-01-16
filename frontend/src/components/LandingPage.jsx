import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Store, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-teal-50 to-white">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 border-4 border-[#14b8a6]">
            <span className="text-4xl font-black text-[#14b8a6]">P</span>
        </motion.div>
        
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl font-black text-gray-900 mb-4">
          PEP's <span className="text-[#14b8a6]">Digital</span>
        </motion.h1>
        
        <p className="text-xl text-gray-500 mb-12 max-w-md">La plateforme locale qui connecte membres et commerçants partenaires.</p>

        <div className="space-y-4 w-full max-w-sm">
            <Link to="/login" onClick={()=>localStorage.setItem('login_type','member')} className="block bg-[#14b8a6] text-white p-5 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-between hover:scale-105 transition">
                <span className="flex items-center gap-3"><User/> Je suis Membre</span> <ArrowRight/>
            </Link>

            <Link to="/login" onClick={()=>localStorage.setItem('login_type','partner')} className="block bg-white text-gray-900 border-2 border-gray-100 p-5 rounded-2xl font-bold text-lg flex items-center justify-between hover:border-[#f97316] hover:text-[#f97316] transition">
                <span className="flex items-center gap-3"><Store/> Je suis Partenaire</span> <ArrowRight/>
            </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 w-full max-w-sm">
            <p className="text-gray-400 text-sm mb-2">Pas encore inscrit ?</p>
            <Link to="/register" className="text-[#14b8a6] font-bold hover:underline uppercase text-sm tracking-widest">Créer un compte gratuit</Link>
        </div>
      </div>
    </div>
  );
}
