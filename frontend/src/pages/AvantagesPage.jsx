import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Users, Store, Building2, MapPin, Gift, TrendingUp, Heart, Sparkles, ArrowRight, Check } from 'lucide-react';

const AvantagesPage = () => {
  const [activeSection, setActiveSection] = useState('membres');
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  // Animation d'étoiles flottantes
  const [stars, setStars] = useState([]);
  
  useEffect(() => {
    const newStars = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
    }));
    setStars(newStars);
  }, []);

  const scrollToSection = (section) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-emerald-50 font-sans">
      
      {/* Étoiles flottantes en arrière-plan */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-20"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* HERO - Triangle d'Or */}
      <motion.div 
        className="relative py-20 px-4 text-center overflow-hidden"
        style={{ opacity }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-rose-500 bg-clip-text text-transparent">
            Les Avantages PEP'S pour Tous
          </h1>
          <p className="text-xl text-gray-700 mb-12">
            Soutenir l'économie locale par l'innovation digitale
          </p>

          {/* Triangle d'Or Interactif */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { id: 'membres', icon: Users, label: 'Membres', color: 'emerald', desc: 'Des privilèges exclusifs' },
              { id: 'commercants', icon: Store, label: 'Commerçants', color: 'teal', desc: 'Visibilité & fidélisation' },
              { id: 'entreprises', icon: Building2, label: 'Entreprises', color: 'rose', desc: 'Fidélisez vos talents' },
            ].map((item) => (
              <motion.div
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`relative cursor-pointer p-8 rounded-3xl bg-gradient-to-br from-${item.color}-100 to-${item.color}-200 shadow-xl hover:shadow-2xl transition-all duration-300 group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}-400 to-${item.color}-600 opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`} />
                
                <motion.div
                  animate={{ rotate: activeSection === item.id ? 360 : 0 }}
                  transition={{ duration: 0.6 }}
                  className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-${item.color}-500 to-${item.color}-700 flex items-center justify-center shadow-lg`}
                >
                  <item.icon className="w-10 h-10 text-white" />
                </motion.div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.label}</h3>
                <p className="text-gray-600">{item.desc}</p>
                
                <motion.div
                  className="mt-4 flex items-center justify-center text-emerald-600 font-semibold"
                  animate={{ x: activeSection === item.id ? [0, 5, 0] : 0 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  Découvrir <ArrowRight className="ml-2 w-5 h-5" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* SECTION MEMBRES */}
      <motion.section
        id="membres"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-20 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="inline-block p-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 mb-6"
            >
              <Users className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Pour les <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Membres</span>
            </h2>
            <p className="text-xl text-gray-600">Profite de privilèges exclusifs chez plus de 100 partenaires</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {[
              { icon: Gift, title: 'Privilèges Exclusifs', desc: 'Réductions, cadeaux et services gratuits chez tous nos partenaires' },
              { icon: MapPin, title: 'Partout près de toi', desc: 'En Suisse, France et Belgique' },
              { icon: Sparkles, title: 'Activation Magique', desc: 'Un clic et des étoiles multicolores pour valider ton privilège' },
              { icon: Heart, title: 'Soutien Local', desc: 'Chaque privilège utilisé soutient l\'économie locale' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                className="p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
                    <item.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="text-center"
          >
            <a
              href="/register/select"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-lg font-bold shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300"
            >
              Devenir Membre <ArrowRight className="w-6 h-6" />
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION COMMERÇANTS */}
      <motion.section
        id="commercants"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-20 px-4 bg-gradient-to-br from-teal-50 to-cyan-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="inline-block p-4 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 mb-6"
            >
              <Store className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Pour les <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Commerçants</span>
            </h2>
            <p className="text-xl text-gray-600">Rejoins gratuitement et attire de nouveaux clients</p>
          </div>

          {/* Carte de Chaleur Animée */}
          <div className="relative mb-12 p-12 rounded-3xl bg-gradient-to-br from-teal-100 to-cyan-100 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-32 h-32 rounded-full border-4 border-teal-400"
                  animate={{
                    scale: [1, 3, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.7,
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-block p-6 rounded-2xl bg-white shadow-xl mb-6"
              >
                <Store className="w-16 h-16 text-teal-600" />
              </motion.div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Ton Commerce au Centre</h3>
              <p className="text-xl text-gray-700 mb-4">Atteins jusqu'à <span className="text-4xl font-extrabold text-teal-600">+1500</span> clients potentiels</p>
              <p className="text-gray-600">Grâce à notre réseau de membres actifs</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: TrendingUp, title: 'Visibilité', desc: 'Apparais sur la carte interactive' },
              { icon: Users, title: 'Fidélisation', desc: 'Transforme les visiteurs en clients réguliers' },
              { icon: Gift, title: 'Gratuit', desc: 'Aucun frais d\'inscription ou d\'abonnement' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl bg-white shadow-lg text-center"
              >
                <div className="inline-block p-4 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 mb-4">
                  <item.icon className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="text-center"
          >
            <a
              href="/partner-register"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-lg font-bold shadow-2xl hover:shadow-teal-500/50 transition-all duration-300"
            >
              Devenir Partenaire Gratuit <ArrowRight className="w-6 h-6" />
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* SECTION ENTREPRISES */}
      <motion.section
        id="entreprises"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-20 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="inline-block p-4 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 mb-6"
            >
              <Building2 className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Pour les <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Entreprises</span>
            </h2>
            <p className="text-xl text-gray-600">Offre PEP'S à tes équipes et booste leur engagement</p>
          </div>

          {/* Ruban Cadeau Déroulant */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative mb-12 p-12 rounded-3xl bg-gradient-to-r from-rose-100 via-pink-100 to-rose-100 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-pink-500" />
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-pink-500" />
            
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-block mb-6"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-2xl">
                    <Gift className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-400 border-4 border-white" />
                </div>
              </motion.div>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Un Cadeau qui Compte</h3>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {[
                  { label: 'Fidélisation', value: '+40%', desc: 'des employés se sentent valorisés' },
                  { label: 'Engagement', value: '+60%', desc: 'utilisent activement leurs privilèges' },
                  { label: 'Économies', value: '1000 CHF', desc: 'pour 30 employés seulement' },
                  { label: 'Impact', value: '100%', desc: 'soutien à l\'économie locale' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-xl bg-white shadow-lg"
                  >
                    <div className="text-4xl font-extrabold text-rose-600 mb-2">{stat.value}</div>
                    <div className="text-lg font-bold text-gray-900 mb-1">{stat.label}</div>
                    <div className="text-sm text-gray-600">{stat.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { title: 'Simple', desc: 'Un package, plusieurs accès' },
              { title: 'Flexible', desc: 'De 1 à 5000 accès' },
              { title: 'Impactant', desc: 'Tes équipes te remercieront' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 text-center"
              >
                <Check className="w-8 h-8 text-rose-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="text-center"
          >
            <a
              href="/register/select"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-lg font-bold shadow-2xl hover:shadow-rose-500/50 transition-all duration-300"
            >
              Offrir à mes Équipes <ArrowRight className="w-6 h-6" />
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Final */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-rose-600 text-white text-center"
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-4xl md:text-5xl font-extrabold mb-6"
          >
            Prêt à Rejoindre PEP'S ?
          </motion.h2>
          <p className="text-xl mb-10 text-white/90">
            Plus de 2834 membres heureux et 100+ partenaires actifs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/register/select"
              className="px-8 py-4 rounded-full bg-white text-emerald-600 font-bold text-lg shadow-2xl hover:shadow-white/50 transition-all"
            >
              Devenir Membre
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/partner-register"
              className="px-8 py-4 rounded-full bg-transparent border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-emerald-600 transition-all"
            >
              Devenir Partenaire
            </motion.a>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default AvantagesPage;
