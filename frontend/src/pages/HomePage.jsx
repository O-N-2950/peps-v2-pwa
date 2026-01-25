import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { User, Store, Building, ChevronDown, CheckCircle, Heart, DollarSign, Map, Zap } from 'lucide-react';

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
    answer: "PEP'S connecte les membres à un réseau de commerçants locaux offrant des privilèges exclusifs. Téléchargez l'app, choisissez votre abonnement, et profitez de centaines d'avantages toute l'année !"
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
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-multiply" 
          style={{ backgroundImage: `url(${image})` }}
        ></div>

        {/* Contenu */}
        <div className="relative p-6 flex flex-col h-full text-white">
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
    <div ref={ref} className="text-center">
      <div className="text-6xl font-extrabold text-gray-800 mb-1">
        {count.toLocaleString()}+
      </div>
      <p className="text-lg text-gray-500">{label}</p>
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
    <div ref={ref} className="min-h-screen bg-white">
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
        
        {/* Contenu du Hero */}
        <div className="relative z-10 text-center p-8 backdrop-blur-sm bg-black bg-opacity-30 rounded-xl">
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
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.6 }}
            className="mt-8 px-10 py-4 text-lg font-bold rounded-full shadow-lg transition-all duration-300"
            style={{ backgroundColor: COLORS.corail, color: 'white' }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px rgba(231, 111, 81, 0.6)` }}
          >
            Découvrir les avantages
          </motion.button>
        </div>
      </section>

      {/* 2. SECTION CHIFFRES CLÉS (Compteurs Animés) */}
      <section className="py-16 bg-white shadow-inner">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-3 gap-8">
          <AnimatedCounter endValue={100} label="Partenaires Actifs" />
          <AnimatedCounter endValue={5000} label="Membres Heureux" />
          <AnimatedCounter endValue={20} label="Villes Couvertes" />
        </div>
      </section>

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

          <div className="grid md:grid-cols-3 gap-10">
            <OptionCard 
              delay={1} 
              icon={User} 
              title="Pour les Membres" 
              price="Dès 49 CHF/an"
              desc="Accédez à des centaines de privilèges exclusifs chez les commerçants locaux. Économisez toute l'année." 
              btnText="Voir les tarifs" 
              link="/pricing" 
              color={`bg-[${COLORS.turquoise}]`} // Utilisation de la couleur Turquoise
              image="https://images.unsplash.com/photo-1558778263-e38053641215?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Shopping
              details={["Accès illimité aux offres", "Application mobile incluse", "Support prioritaire"]}
            />
            
            <OptionCard 
              delay={2} 
              icon={Store} 
              title="Pour les Partenaires" 
              price="Gratuit"
              desc="Rejoignez notre réseau et attirez de nouveaux clients fidèles sans frais d'adhésion ni commissions." 
              btnText="Devenir partenaire" 
              link="/register/partner" 
              color={`bg-[${COLORS.corail}]`} // Utilisation de la couleur Corail
              image="https://images.unsplash.com/photo-1596495578051-692237583f73?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Commerçant
              details={["Visibilité augmentée", "Fidélisation client", "Tableau de bord partenaire"]}
            />
            
            <OptionCard 
              delay={3} 
              icon={Building} 
              title="Pour les Entreprises" 
              price="Tarifs dégressifs"
              desc="Offrez des accès PEP'S à vos collaborateurs. Un avantage social moderne et très apprécié." 
              btnText="Demander un devis" 
              link="/contact/entreprise" 
              color="bg-indigo-600" // Couleur secondaire pour l'entreprise
              image="https://images.unsplash.com/photo-1549941328-9d419b4b0e8b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Équipe
              details={["Réduction d'impôts", "Motivation des équipes", "Gestion centralisée des accès"]}
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
              { icon: DollarSign, title: "2. Profitez", desc: "Présentez votre écran mobile et cliquez sur 'Profiter du privilège' devant le commerçant. Si des étoiles apparaissent, c'est la preuve que vous êtes membre actif." },
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

      {/* 6. SECTION FAQ (Accordéon) */}
      <section className="py-24 relative overflow-hidden">
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
          <p>&copy; {new Date().getFullYear()} PEP'S V2. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;