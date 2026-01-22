import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, User, Store, Globe, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

// ==========================================
// LOGO ANIMÉ PEP'S
// ==========================================
const PepsLogo = () => (
  <div className="flex items-center justify-center mb-6 scale-75 md:scale-100 select-none">
    <motion.span 
      className="text-7xl md:text-9xl font-black text-[#2A9D8F] tracking-tighter drop-shadow-[0_0_20px_rgba(42,157,143,0.6)]"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      P
    </motion.span>
    <motion.span 
      className="text-7xl md:text-9xl font-black text-[#E76F51] tracking-tighter drop-shadow-[0_0_20px_rgba(231,111,81,0.6)]"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
    >
      E
    </motion.span>
    <motion.span 
      className="text-7xl md:text-9xl font-black text-[#2A9D8F] tracking-tighter drop-shadow-[0_0_20px_rgba(42,157,143,0.6)]"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
    >
      P
    </motion.span>
    <span className="text-7xl md:text-9xl font-black text-[#E76F51] tracking-tighter">'</span>
    <motion.span 
      className="text-7xl md:text-9xl font-black text-[#2A9D8F] tracking-tighter drop-shadow-[0_0_20px_rgba(42,157,143,0.6)]"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
    >
      S
    </motion.span>
  </div>
);

// ==========================================
// CARTE OPTION
// ==========================================
const OptionCard = ({ icon: Icon, title, price, desc, btnText, link, delay, color, badge }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: delay * 0.1, duration: 0.5 }}
    whileHover={{ scale: 1.05, translateY: -10 }}
    className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col relative overflow-hidden group hover:border-white/30 transition-all shadow-2xl"
  >
    {/* Badge */}
    {badge && (
      <div className="absolute top-4 right-4 bg-[#E76F51] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
        {badge}
      </div>
    )}
    
    {/* Icône */}
    <div className={`p-4 rounded-2xl w-fit mb-4 ${color} bg-opacity-20 text-white group-hover:bg-opacity-100 transition-all duration-500`}>
      <Icon size={32} />
    </div>
    
    {/* Contenu */}
    <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
    {price && <p className="text-[#2A9D8F] font-black text-xl mb-3">{price}</p>}
    <p className="text-gray-400 text-sm mb-8 leading-relaxed flex-grow">{desc}</p>
    
    {/* Bouton */}
    <Link to={link} className="w-full mt-auto">
      <button className="w-full py-3 rounded-xl font-bold bg-white text-gray-900 hover:bg-[#2A9D8F] hover:text-white transition-all flex items-center justify-center gap-2 group-hover:gap-3">
        {btnText} <ArrowRight size={18}/>
      </button>
    </Link>
  </motion.div>
);

// ==========================================
// PAGE D'ACCUEIL PRINCIPALE
// ==========================================
export default function HomePage() {
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    if (search.trim()) {
      window.location.href = `/map?q=${encodeURIComponent(search)}`;
    } else {
      window.location.href = '/map';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden selection:bg-[#E76F51] selection:text-white">
      
      {/* ==========================================
          SECTION 1 : HERO AVEC PARALLAX
          ========================================== */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        {/* Background avec parallax */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/80 via-[#0F172A]/90 to-[#0F172A] z-10" />
          <img 
            src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2564" 
            className="w-full h-full object-cover opacity-40" 
            alt="City night" 
          />
        </div>

        {/* NAVBAR OVERLAY */}
        <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="font-bold text-xl tracking-tighter">PEP'S</div>
          <div className="flex gap-4">
            <Link to="/pricing" className="text-gray-300 hover:text-white font-bold py-2 transition">
              Tarifs
            </Link>
            <Link to="/login" className="bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2 rounded-full font-bold transition backdrop-blur-sm">
              Connexion
            </Link>
          </div>
        </nav>

        {/* CONTENU HERO */}
        <div className="relative z-20 max-w-5xl mx-auto text-center mt-[-50px]">
          {/* Logo animé */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.8 }}
          >
            <PepsLogo />
          </motion.div>
          
          {/* Slogan principal */}
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight drop-shadow-2xl"
          >
            Soutenir l'économie locale par <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2A9D8F] to-[#E76F51]">
              l'innovation digitale
            </span>
          </motion.h1>

          {/* Badge accrocheur */}
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ delay: 0.6, type: "spring" }}
            className="inline-flex bg-white/10 backdrop-blur border border-white/20 px-6 py-2 rounded-full mb-12 shadow-[0_0_20px_rgba(231,111,81,0.4)]"
          >
            <span className="font-bold text-[#E76F51] flex items-center gap-2">
              <Sparkles size={20} /> Mets du PEP'S dans ta vie !
            </span>
          </motion.div>

          {/* BARRE DE RECHERCHE */}
          <motion.div 
            initial={{ width: "80%", opacity: 0 }} 
            animate={{ width: "100%", opacity: 1 }} 
            transition={{ delay: 0.8 }}
            className="flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl hover:border-white/40 transition-all mx-auto max-w-2xl"
          >
            <MapPin className="text-[#E76F51] ml-3 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Rechercher un commerce, une ville..." 
              className="bg-transparent border-none outline-none text-white w-full p-3 font-medium placeholder-gray-400"
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="bg-gradient-to-r from-[#2A9D8F] to-[#21867a] p-3 rounded-xl hover:shadow-lg transition shrink-0 m-1"
            >
              <Search className="text-white" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* ==========================================
          SECTION 2 : 3 OPTIONS CLAIRES
          ========================================== */}
      <div className="relative z-20 -mt-32 pb-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Option 1 : Devenir Membre */}
          <OptionCard 
            delay={1} 
            icon={User} 
            title="Devenir Membre" 
            price="Dès 49 CHF/an"
            desc="Bénéficie de privilèges exclusifs chez 100+ commerçants partenaires. De 1 à 5000 accès disponibles avec tarifs dégressifs. Pour toi, ta famille, ou ton équipe !"
            btnText="Voir les tarifs" 
            link="/pricing" 
            color="bg-[#2A9D8F]"
          />
          
          {/* Option 2 : Devenir Partenaire */}
          <OptionCard 
            delay={2} 
            icon={Store} 
            title="Devenir Partenaire" 
            price="GRATUIT" 
            badge="POPULAIRE"
            desc="Commerçant, association, artisan ? Rejoins PEP'S gratuitement et offre un privilège exclusif à nos membres. Booste ta visibilité locale !"
            btnText="Rejoindre gratuitement" 
            link="/register?type=partner" 
            color="bg-[#E76F51]"
          />
          
          {/* Option 3 : Explorer */}
          <OptionCard 
            delay={3} 
            icon={Globe} 
            title="Explorer" 
            price="GRATUIT"
            desc="Découvre les commerçants partenaires, les privilèges disponibles et la carte interactive avant de t'inscrire. Aucune carte bancaire requise."
            btnText="Voir la carte" 
            link="/map" 
            color="bg-blue-500"
          />
        </div>
      </div>

      {/* ==========================================
          SECTION 3 : CARTE INTERACTIVE (TODO)
          ========================================== */}
      <div className="relative z-20 pb-24 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Découvre nos partenaires près de chez toi
          </h2>
          <p className="text-gray-400 text-lg">
            Plus de 100 commerçants locaux t'attendent avec des privilèges exclusifs
          </p>
        </motion.div>

        {/* Placeholder pour la carte - À remplacer par MapPage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <div className="aspect-video bg-gradient-to-br from-[#2A9D8F]/20 to-[#E76F51]/20 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <MapPin size={64} className="text-[#2A9D8F] mx-auto mb-4" />
              <p className="text-xl font-bold mb-2">Carte interactive</p>
              <p className="text-gray-400 mb-4">Explore tous les partenaires sur la carte</p>
              <Link to="/map">
                <button className="bg-[#2A9D8F] hover:bg-[#21867a] text-white px-6 py-3 rounded-xl font-bold transition">
                  Ouvrir la carte complète
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ==========================================
          SECTION 4 : FOOTER
          ========================================== */}
      <footer className="bg-[#0B1120] py-12 text-center text-gray-500 border-t border-white/5 relative z-20">
        <div className="flex flex-wrap justify-center gap-8 mb-6 font-bold text-gray-400">
          <span>100+ Partenaires</span>
          <span>1000+ Membres</span>
          <span>100% Swiss Made</span>
        </div>
        <p className="text-sm">© 2026 PEP'S Switzerland. Tous droits réservés.</p>
        <div className="flex justify-center gap-6 mt-4">
          <Link to="/legal" className="text-gray-500 hover:text-white transition text-sm">
            Mentions légales
          </Link>
          <Link to="/privacy" className="text-gray-500 hover:text-white transition text-sm">
            Confidentialité
          </Link>
          <Link to="/contact" className="text-gray-500 hover:text-white transition text-sm">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
