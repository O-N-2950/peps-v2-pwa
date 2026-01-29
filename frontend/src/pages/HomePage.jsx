import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { User, Store, Building, ChevronDown, CheckCircle, Heart, DollarSign, Map, Zap } from 'lucide-react';

import PWAInstallGuide from '../components/PWAInstallGuide';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import FlashOffersWidget from '../components/FlashOffersWidget';
import MapPage from '../components/MapPage';
import axios from 'axios';

// --- COULEURS OFFICIELLES PEP'S ---
const COLORS = {
  turquoise: '#2A9D8F',
  corail: '#E76F51',
  background: '#F4F7F9', // Gris très léger pour le fond
};

// --- DONNÉES ---
const TESTIMONIALS = [
  {
    name: "Sophie Martin",
    role: "Membre depuis 2024",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29329?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Femme souriante
    text: "Grâce à PEP'S, j'ai découvert des commerces locaux incroyables et économisé plus de 500 CHF cette année !",
  },
  {
    name: "Marc Dubois",
    role: "Partenaire - Restaurant Le Gourmet",
    avatar: "https://images.unsplash.com/photo-1507003211167-9c7170e16090?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Homme barbu souriant
    text: "PEP'S m'a apporté 30% de nouveaux clients en seulement 3 mois. Une plateforme indispensable !",
  },
  {
    name: "Laura Schneider",
    role: "DRH - TechCorp SA",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Femme en costume
    text: "Nos collaborateurs adorent leurs accès PEP'S. Un avantage social moderne et apprécié !",
  }
];

const FAQ_ITEMS = [
  {
    question: "Comment fonctionne PEP'S ?",
    answer: "PEP'S connecte les membres à un réseau de commerçants locaux offrant des privilèges exclusifs. Inscris-toi et profite de centaines de privilèges toute l'année !"
  },
  {
    question: "Combien coûte l'abonnement ?",
    answer: `L'abonnement individuel commence à 49 CHF/an. Pour les entreprises, des tarifs dégressifs sont disponibles selon le nombre d'accès.`,
  },
  {
    question: "Comment devenir partenaire ?",
    answer: "C'est gratuit ! Inscrivez-vous via notre formulaire partenaire, proposez un privilège exclusif, et une fois validé par notre équipe, vous serez visible sur la carte et dans l'app."
  },
  {
    question: "Les privilèges sont-ils cumulables ?",
    answer: "Cela dépend du partenaire. Certains privilèges sont cumulables avec d'autres offres, d'autres non. Les conditions sont toujours indiquées dans la description du privilège."
  },
  {
    question: "Puis-je annuler mon abonnement ?",
    answer: "Oui, vous pouvez annuler à tout moment. L'accès reste actif jusqu'à la fin de la période payée."
  }
];

// --- COMPOSANTS MODULAIRES ---

/**
 * 1. Option Card Améliorée (avec Image de fond, Glassmorphism et Hover)
 */
const OptionCard = ({ delay, icon: Icon, title, price, desc, btnText, link, color, image, details }) => {
  const hoverVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: { scale: 1.05, rotate: 0.5, boxShadow: `0 15px 30px rgba(0, 0, 0, 0.15)` },
  };

  const staggerVariants = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0, transition: { duration: 0.7, delay: delay * 0.2 } },
  };

  return (
    <motion.div
      variants={staggerVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: true, amount: 0.3 }}
      className="perspective-1000"
    >
      <motion.div
        variants={hoverVariants}
        whileHover="hover"
        className={`relative overflow-hidden rounded-2xl shadow-xl min-h-[450px] transition-all duration-300 backdrop-blur-sm ${color} bg-opacity-70`}
        style={{
          // Effet Glassmorphism
          border: '1px solid rgba(255, 255, 255, 0.3)',
          background: `linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
        }}
      >
        {/* Image de fond semi-transparente */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40" 
          style={{ backgroundImage: `url(${image})` }}
        ></div>
        
        {/* Overlay sombre pour contraste */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/40"></div>

        {/* Contenu */}
        <div className="relative p-6 flex flex-col h-full text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          <div className="flex justify-between items-start mb-4">
            <Icon size={40} className="p-2 rounded-full bg-white bg-opacity-20 shadow-lg" />
            <span className="text-xl font-semibold bg-white bg-opacity-30 px-3 py-1 rounded-full">{price}</span>
          </div>
          
          <h3 className="text-3xl font-extrabold mt-2 mb-2">{title}</h3>
          <p className="text-sm opacity-90 mb-4 flex-grow">{desc}</p>

          <ul className="text-sm opacity-90 mb-6 space-y-1">
            {details.map((detail, index) => (
              <li key={index} className="flex items-center">
                <CheckCircle size={16} className="mr-2 text-white/80" />
                {detail}
              </li>
            ))}
          </ul>

          <motion.a
            href={link}
            className="mt-auto w-full text-center py-3 rounded-xl font-bold transition-all duration-300 bg-white text-gray-800 hover:bg-gray-100 shadow-lg"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
            whileTap={{ scale: 0.98 }}
          >
            {btnText}
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * 2. Compteur Animé
 */
const AnimatedCounter = ({ endValue, duration = 3, label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    if (inView) {
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        setCount(Math.floor(progress * endValue));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [inView, endValue, duration]);

  return (
    <div ref={ref} className="text-center px-4">
      <div className="text-5xl sm:text-6xl font-extrabold text-gray-800 mb-2">
        {count.toLocaleString()}+
      </div>
      <p className="text-base sm:text-lg text-gray-500 whitespace-nowrap">{label}</p>
    </div>
  );
};

/**
 * 3. Section Témoignages (Carrousel Glassmorphism)
 */
const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const testimonial = TESTIMONIALS[currentIndex];

  return (
    <motion.section
      className="py-20 bg-gray-50 relative overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
    >
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <h2 className="text-5xl font-extrabold text-center mb-16 text-gray-900">
          Ce qu'ils disent de <span style={{ color: COLORS.corail }}>PEP'S</span>
        </h2>

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="p-8 rounded-3xl shadow-2xl relative text-center mx-auto max-w-2xl"
          style={{
            // Glassmorphism pour la carte du témoignage
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
          }}
        >
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-20 h-20 rounded-full mx-auto -mt-16 mb-4 object-cover ring-4"
            style={{ borderColor: COLORS.turquoise }}
          />
          <p className="text-xl italic text-gray-700 mb-6">
            "{testimonial.text}"
          </p>
          <p className="font-bold text-lg text-gray-900">{testimonial.name}</p>
          <p className="text-sm text-gray-600">{testimonial.role}</p>
        </motion.div>

        <div className="flex justify-center mt-8 space-x-4">
          <button onClick={handlePrev} className="p-3 rounded-full bg-white shadow-md hover:bg-gray-100 transition">
            <ChevronDown size={20} className="transform rotate-90" />
          </button>
          <button onClick={handleNext} className="p-3 rounded-full bg-white shadow-md hover:bg-gray-100 transition">
            <ChevronDown size={20} className="transform -rotate-90" />
          </button>
        </div>
      </div>
    </motion.section>
  );
};

/**
 * 4. Section FAQ (Accordéon)
 */
const FAQItem = ({ question, answer, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="border-b border-gray-200"
    >
      <button
        className="flex justify-between items-center w-full py-4 text-left font-semibold text-gray-800 hover:text-gray-900 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center">
          <Zap size={20} className="mr-3" style={{ color: COLORS.turquoise }} />
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <p className="pb-4 pl-8 text-gray-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- HOME PAGE PRINCIPALE ---

const HomePage = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [showPWAGuide, setShowPWAGuide] = useState(false);

  // Charger les partenaires depuis l'API
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await axios.get('https://www.peps.swiss/api/partners?status=active');
        const partnersData = Array.isArray(response.data) ? response.data : [];
        setPartners(partnersData);
      } catch (error) {
        console.error('Erreur chargement partenaires:', error);
      } finally {
        setLoadingPartners(false);
      }
    };
    fetchPartners();
  }, []);

  // Parallax pour le fond du Hero
  const yParallax = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  // Gradient animé pour le fond
  const GradientBackground = () => (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <motion.div
        className="w-full h-full"
        style={{
          background: `radial-gradient(circle at top left, ${COLORS.turquoise} 0%, transparent 40%), radial-gradient(circle at bottom right, ${COLORS.corail} 0%, transparent 40%)`,
          opacity: 0.1,
          scale: 2,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );

  return (
    <div ref={ref} className="bg-gray-50">
      {/* Header avec boutons de connexion */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-md">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#38B2AC] to-[#F26D7D] bg-clip-text text-transparent">
              PEP'S
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Bouton Connexion Membre - Responsive */}
            <a
              href="/login/member"
              className="group relative px-3 py-2 md:px-6 md:py-3 bg-gradient-to-r from-[#38B2AC] to-[#2A9D8F] text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-1 md:gap-2 text-xs md:text-base"
            >
              <User className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Accès Membre</span>
              <span className="sm:hidden">Accès Membre</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
            </a>
            
            {/* Bouton Connexion Partenaire - Responsive */}
            <a
              href="/login/partner"
              className="group relative px-3 py-2 md:px-6 md:py-3 bg-gradient-to-r from-[#F26D7D] to-[#E76F51] text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-1 md:gap-2 text-xs md:text-base"
            >
              <Store className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Accès Partenaire</span>
              <span className="sm:hidden">Accès Partenaire</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
            </a>
            
            {/* Bouton Admin - Discret mais visible (icône uniquement sur mobile) */}
            <a
              href="/admin"
              className="px-2 py-2 md:px-3 md:py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
              title="Administration"
            >
              <span className="text-base md:text-xs">⚙️</span>
              <span className="hidden md:inline">Admin</span>
            </a>
          </div>
        </div>
      </header>

      {/* PWA Install Guide Modal */}
      <PWAInstallGuide isOpen={showPWAGuide} onClose={() => setShowPWAGuide(false)} />
      
      {/* PWA Install Prompt (Bottom Sheet) */}
      <PWAInstallPrompt />

      <GradientBackground />

      {/* 1. HERO SECTION (Parallax) */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Fond Parallax */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1542838132-92c77d40243d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)`, // Image de commerce local
            y: yParallax,
            scale: 1.1,
            filter: 'brightness(0.5)',
          }}
        />
        
        {/* Vidéo Pepi Bienvenue */}
        <div className="absolute top-20 sm:top-24 left-1/2 transform -translate-x-1/2 z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-32 h-32 md:w-40 md:h-40"
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain drop-shadow-2xl"
              src="/videos/pepi-01-bienvenue-bonjour.mp4"
            />
          </motion.div>
        </div>
        
        {/* Contenu du Hero */}
        <div className="relative z-10 text-center p-8 backdrop-blur-sm bg-black bg-opacity-30 rounded-xl mt-40">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-8xl font-black text-white mb-4"
          >
            PEP'S
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-2xl md:text-3xl text-gray-200 max-w-3xl mx-auto"
          >
            Vos privilèges locaux, partout en <span style={{ color: COLORS.turquoise }}>Suisse</span>, <span style={{ color: COLORS.corail }}>France</span> et <span style={{ color: COLORS.turquoise }}>Belgique</span>.
          </motion.p>
          <motion.a
            href="/avantages"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.6 }}
            className="mt-8 px-10 py-4 text-lg font-bold rounded-full shadow-lg transition-all duration-300 inline-block cursor-pointer"
            style={{ backgroundColor: COLORS.corail, color: 'white' }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px rgba(231, 111, 81, 0.6)` }}
          >
            Découvrir les avantages
          </motion.a>
        </div>
      </section>

      {/* 2. SECTION CHIFFRES CLÉS (Compteurs Animés) */}
      <section className="py-16 bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
          <AnimatedCounter endValue={100} label="Partenaires Actifs" />
          <AnimatedCounter endValue={5000} label="Membres Heureux" />
          <AnimatedCounter endValue={20} label="Villes Couvertes" />
        </div>
      </section>

      {/* 2.5 WIDGET OFFRES FLASH */}
      <FlashOffersWidget />

      {/* 3. SECTION CHOISISSEZ VOTRE OPTION (Stagger + Glassmorphism) */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-extrabold text-center mb-16 text-gray-900"
          >
            Choisissez votre <span style={{ color: COLORS.turquoise }}>option</span>
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <OptionCard 
              delay={1} 
              icon={User} 
              title="Pour les Membres" 
              price="49 CHF/an"
              desc="Accédez à des centaines de privilèges exclusifs chez les commerçants locaux." 
              btnText="Voir les tarifs" 
              link="/pricing" 
              color={`bg-[${COLORS.turquoise}]`}
              image="/images/members-bg.jpg"
              details={["Accès illimité", "App mobile", "Support prioritaire"]}
            />
            
            <OptionCard 
              delay={2} 
              icon={Heart} 
              title="Pour les Familles" 
              price="Dès 89 CHF/an"
              desc="Économisez en famille avec 2 à 5 accès. Partagez les privilèges avec vos proches." 
              btnText="Voir les tarifs" 
              link="/pricing" 
              color="bg-pink-500"
              image="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              details={["2 à 5 accès", "Tarifs dégressifs", "Partage facile"]}
            />
            
            <OptionCard 
              delay={3} 
              icon={Store} 
              title="Pour les Partenaires" 
              price="Gratuit"
              desc="Rejoignez notre réseau et attirez de nouveaux clients fidèles sans frais." 
              btnText="Devenir partenaire" 
              link="/register/partner" 
              color={`bg-[${COLORS.corail}]`}
              image="/images/partners-bg.jpg"
              details={["Visibilité +", "Fidélisation", "Dashboard"]}
            />
            
            <OptionCard 
              delay={4} 
              icon={Building} 
              title="Pour les Entreprises" 
              price="Dès 49 CHF/an"
              desc="Offrez des accès PEP'S à vos collaborateurs. Tarifs identiques aux particuliers." 
              btnText="Voir les tarifs" 
              link="/pricing" 
              color="bg-indigo-600"
              image="/images/business-bg.jpg"
              details={["À partir de 1 accès", "Tarifs dégressifs", "Gestion centralisée"]}
            />
          </div>
        </div>
      </section>
      
      {/* 4. SECTION COMMENT ÇA MARCHE ? (3 étapes simples) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-extrabold text-center mb-16 text-gray-900"
          >
            Comment ça <span style={{ color: COLORS.corail }}>marche</span> ?
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Map, title: "1. Localisez", desc: "Trouvez les commerces partenaires près de chez vous sur la carte interactive ou dans l'application." },
              { icon: DollarSign, title: "2. Profitez", desc: "Présentez votre écran mobile et cliquez sur 'Activez votre privilège' devant le commerçant. Si des étoiles apparaissent, c'est la preuve que vous êtes membre actif." },
              { icon: Heart, title: "3. Soutenez", desc: "Faites des économies tout en soutenant l'économie locale et les petits commerçants." },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center p-6 bg-white rounded-xl shadow-lg border-t-4"
                style={{ borderColor: index === 1 ? COLORS.corail : COLORS.turquoise }}
              >
                <step.icon size={48} className="mx-auto mb-4" style={{ color: index === 1 ? COLORS.corail : COLORS.turquoise }} />
                <h3 className="text-2xl font-bold mb-2 text-gray-800">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SECTION TÉMOIGNAGES (Carrousel Glassmorphism) */}
      <TestimonialsSection />

      {/* 6. SECTION CARTE INTERACTIVE */}
      <section className="py-24 bg-gradient-to-br from-[#38B2AC]/10 to-[#F26D7D]/10">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-extrabold text-center mb-6 text-gray-900"
          >
            Découvrez nos <span style={{ color: COLORS.turquoise }}>partenaires</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto"
          >
            Explorez notre réseau de commerçants locaux et trouvez les meilleurs privilèges près de chez vous !
          </motion.p>

          {loadingPartners ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#38B2AC]"></div>
              <p className="mt-4 text-gray-600">Chargement de la carte...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ height: '600px' }}
            >
              <MapPage />
            </motion.div>
          )}

          {/* CTA pour télécharger l'app */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-12"
          >
            <p className="text-lg text-gray-700 mb-4">
              💡 <strong>Envie d'explorer tous les privilèges ?</strong> Cliquez sur un marqueur pour découvrir les détails !
            </p>
            <p className="text-sm text-gray-600">
              🌐 <strong>PEP'S est une PWA</strong> : Ajoutez-la à votre écran d'accueil pour un accès rapide !
            </p>
          </motion.div>
        </div>
      </section>

      {/* 7. SECTION FAQ (Accordéon) */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-extrabold text-center mb-12 text-gray-900"
          >
            Questions <span style={{ color: COLORS.turquoise }}>fréquentes</span>
          </motion.h2>

          <div className="bg-white p-6 rounded-2xl shadow-2xl">
            {FAQ_ITEMS.map((item, index) => (
              <FAQItem 
                key={index} 
                question={item.question} 
                answer={item.answer} 
                index={index} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER ou CTA final (Simple pour l'exemple) */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} PEP'S. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;