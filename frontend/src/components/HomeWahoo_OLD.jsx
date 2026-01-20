import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Gift, Users, ArrowRight, Star, Download, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';

export default function HomeWahoo() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      
      {/* HERO avec Logo PEP's */}
      <div className="relative bg-gradient-to-br from-[#3D9A9A] via-[#2D7A7A] to-[#1F5A5A] text-white h-[90vh] flex items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 z-10"/>
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=2000')] bg-cover bg-center" 
        />
        
        <div className="relative z-20 max-w-5xl">
            <motion.div initial={{opacity:0, y:40}} animate={{opacity:1, y:0}} transition={{duration:1}}>
                {/* Logo PEP's */}
                <motion.img 
                  src="/logos/logo_peps_complet-1.png" 
                  alt="PEP's Logo" 
                  className="h-24 md:h-32 mx-auto mb-8"
                  initial={{scale:0.8, opacity:0}}
                  animate={{scale:1, opacity:1}}
                  transition={{duration:0.8, delay:0.2}}
                />
                
                {/* Slogan Principal */}
                <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight uppercase tracking-wide">
                    Soutenir l'économie locale<br/>par l'innovation digitale
                </h1>
                
                {/* Call to Action */}
                <motion.p 
                  className="text-2xl md:text-4xl font-bold text-[#E06B7D] mb-10"
                  initial={{opacity:0}}
                  animate={{opacity:1}}
                  transition={{delay:0.5, duration:0.8}}
                >
                    Mets du PEP's dans ta vie !
                </motion.p>
                
                <p className="text-lg md:text-xl text-gray-200 mb-12 max-w-3xl mx-auto font-light">
                    Découvre plus de 100 commerçants partenaires et profite de privilèges exclusifs autour de toi.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/map" className="bg-white text-[#3D9A9A] px-10 py-5 rounded-full font-black text-lg hover:bg-gray-100 transition shadow-2xl flex items-center justify-center gap-3 group">
                        <MapPin className="group-hover:scale-110 transition"/> EXPLORER LA CARTE
                    </Link>
                    <Link to="/register" className="bg-[#E06B7D] text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-pink-600 transition shadow-2xl">
                        DEVENIR MEMBRE
                    </Link>
                </div>
            </motion.div>
        </div>
      </div>

      {/* STATS Animées */}
      <div className="bg-gradient-to-r from-[#3D9A9A] to-[#2D7A7A] py-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              {n:101, l:'Partenaires', icon:<Store size={32}/>}, 
              {n:1500, l:'Membres', icon:<Users size={32}/>}, 
              {n:3, l:'Pays', icon:<MapPin size={32}/>}, 
              {n:50, l:'Villes', icon:<Gift size={32}/>}
            ].map((s,i) => (
                <motion.div 
                  key={i}
                  initial={{opacity:0, y:20}}
                  whileInView={{opacity:1, y:0}}
                  transition={{delay:i*0.1, duration:0.6}}
                  viewport={{once:true}}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition"
                >
                    <div className="text-white mb-3 flex justify-center">{s.icon}</div>
                    <div className="text-5xl font-black text-white mb-2">
                      <CountUp end={s.n} duration={2.5} delay={0.5}/>+
                    </div>
                    <div className="text-teal-100 text-sm font-bold uppercase tracking-widest">{s.l}</div>
                </motion.div>
            ))}
        </div>
      </div>

      {/* APP MOBILE */}
      <section className="py-32 px-6 text-center bg-gradient-to-b from-gray-50 to-white">
        <motion.div
          initial={{opacity:0, scale:0.9}}
          whileInView={{opacity:1, scale:1}}
          transition={{duration:0.8}}
          viewport={{once:true}}
        >
          <Smartphone size={64} className="mx-auto mb-8 text-[#E06B7D]"/>
          <h2 className="text-5xl font-black mb-6 text-gray-900">Disponible sur Mobile</h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Télécharge l'application PEP's et accède à tes privilèges partout, même hors ligne.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-800 transition shadow-xl">
                <Download size={20}/> App Store
              </button>
              <button className="border-2 border-black px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition shadow-xl">
                <Download size={20}/> Google Play
              </button>
          </div>
        </motion.div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 text-center">
        <img src="/logos/logo_peps_color-1.png" alt="PEP's" className="h-12 mx-auto mb-6 opacity-80"/>
        <p className="text-sm opacity-60 mb-2">© 2026 PEP's Swiss SA</p>
        <p className="text-xs opacity-40">Soutenir l'économie locale par l'innovation digitale</p>
      </footer>
    </div>
  );
}
