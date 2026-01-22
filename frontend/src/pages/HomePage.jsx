import React from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Smartphone, Star } from 'lucide-react';

// Composant Logo CSS (Rendu immédiat sans attendre l'image)
const PepsLogo = ({ size = "text-6xl" }) => (
  <div className={`font-black tracking-tighter select-none ${size}`}>
    <span className="text-[#2A9D8F]">P</span>
    <span className="text-[#E76F51]">E</span>
    <span className="text-[#2A9D8F]">P</span>
    <span className="text-[#E76F51]">'</span>
    <span className="text-[#2A9D8F]">S</span>
  </div>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans overflow-x-hidden">
      
      {/* BACKGROUND IMAGE - VILLE NUIT */}
      <div 
        className="fixed inset-0 z-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2564&auto=format&fit=crop')" }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-gray-900/80 via-gray-900/90 to-gray-900 pointer-events-none" />

      {/* HEADER / NAV */}
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="scale-75 origin-left md:scale-100">
           <PepsLogo size="text-4xl" />
        </div>
        <div className="flex gap-4">
            <Link to="/login" className="text-white font-bold hover:text-[#2A9D8F] transition py-2">Connexion</Link>
            <Link to="/register" className="bg-[#E76F51] hover:bg-[#d65f41] text-white px-5 py-2 rounded-full font-bold shadow-lg transition transform hover:scale-105">
                S'inscrire
            </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 mt-12 md:mt-24 max-w-4xl mx-auto">
        
        {/* LOGO HERO */}
        <div className="mb-8 animate-fade-in-up">
            <PepsLogo size="text-7xl md:text-9xl" />
            <div className="text-2xl md:text-3xl font-light italic mt-2 text-white/90">
                Platform for Exclusive Partnerships
            </div>
        </div>

        {/* SLOGAN */}
        <h1 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight drop-shadow-lg">
            Soutenir l'économie locale par <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A9D8F] to-[#E76F51]">
                l'innovation digitale
            </span>
        </h1>

        {/* PASTILLE PUNCHY */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-3 rounded-full mb-10 transform hover:scale-105 transition duration-300 cursor-default shadow-[0_0_15px_rgba(231,111,81,0.5)]">
            <span className="text-xl md:text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span className="text-[#E76F51]">⚡</span> Mets du PEP'S dans ta vie !
            </span>
        </div>

        {/* TEXTE DESCRIPTIF */}
        <p className="text-lg md:text-xl text-white/80 mb-10 max-w-3xl leading-relaxed">
            Soutiens les commerces locaux et bénéficie d'avantages exclusifs toute l'année. Une application qui connecte les membres, les commerçants et les entreprises autour de privilèges qui font du bien à tous.
        </p>

        {/* SEARCH BAR (PREVIEW) */}
        <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl mb-12">
            <MapPin className="text-[#E76F51] ml-3" />
            <input 
                type="text" 
                placeholder="Rechercher un commerce, une ville..." 
                className="bg-transparent border-none outline-none text-white placeholder-gray-300 w-full p-3 font-medium"
            />
            <button className="bg-[#2A9D8F] p-3 rounded-xl hover:bg-[#21867a] transition">
                <Search className="text-white" />
            </button>
        </div>

        {/* CALL TO ACTIONS */}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-md mx-auto mb-16">
            <button className="flex-1 bg-white text-gray-900 h-14 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition shadow-xl">
                <Smartphone className="text-black" /> App Store
            </button>
            <button className="flex-1 bg-transparent border-2 border-white/30 text-white h-14 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition">
                <Smartphone className="text-white" /> Google Play
            </button>
        </div>

      </main>

      {/* FOOTER SIMPLE */}
      <footer className="relative z-10 mt-12 py-8 text-center text-gray-500 text-sm border-t border-white/5 bg-gray-900/80 backdrop-blur">
        <div className="flex justify-center gap-8 mb-4 text-gray-400 font-bold">
            <div className="flex items-center gap-2"><MapPin size={16}/> 100+ Partenaires</div>
            <div className="flex items-center gap-2"><Star size={16}/> Club VIP</div>
        </div>
        <p>© 2026 PEP'S Switzerland. Tous droits réservés.</p>
        <Link to="/login" className="mt-4 inline-block text-gray-600 hover:text-white transition text-xs">Accès Partenaire</Link>
      </footer>
    </div>
  );
}
