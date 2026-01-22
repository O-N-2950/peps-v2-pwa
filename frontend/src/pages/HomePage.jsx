import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Shield, Users, Gift, Zap, CheckCircle } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans text-gray-800">
      
      {/* HERO SECTION */}
      <header className="relative overflow-hidden pt-20 pb-32 lg:pt-32">
        <div className="container mx-auto px-4 text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-block rounded-full bg-teal-100 px-4 py-1.5 text-sm font-semibold text-teal-700 shadow-sm"
          >
            🚀 Soutenir l'économie locale par l'innovation digitale
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 md:text-7xl"
          >
            Mets du <br />
            <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              PEP'S dans ta vie !
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 md:text-xl"
          >
            Soutiens les commerces locaux et bénéficie d'avantages exclusifs toute l'année. Une application qui connecte les membres, les commerçants et les entreprises autour de privilèges qui font du bien à tous.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            <Link 
              to="/pricing" 
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-teal-600 px-8 py-4 font-bold text-white shadow-lg transition-all duration-300 hover:bg-teal-700 hover:shadow-xl hover:-translate-y-1"
            >
              <span className="mr-2">Voir les tarifs</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <Link 
              to="/partenaires" 
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 font-bold text-teal-700 shadow-md transition-all duration-300 hover:bg-gray-50 hover:shadow-lg hover:-translate-y-1"
            >
              Découvrir les offres
            </Link>
          </motion.div>
        </div>
      </header>

      {/* CARDS SECTION - CORRIGÉE : Pas de distinction de prix */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Carte Particulier */}
            <OptionCard 
              delay={0.2}
              icon={Users}
              title="Pour Vous"
              price="49 CHF / an"
              desc="Profitez du PEP'S en solo ou en famille. L'accès complet à tous les rabais."
              btnText="Je m'abonne"
              link="/pricing" // ✅ Lien direct, pas de paramètre type
              color="bg-teal-500"
              featured={true}
            />

            {/* Carte Cadeau */}
            <OptionCard 
              delay={0.4}
              icon={Gift}
              title="Pour Offrir"
              price="49 CHF / an"
              desc="Le cadeau local parfait. Offrez un code d'activation valable 1 an."
              btnText="Offrir un Pass"
              link="/pricing"
              color="bg-orange-500"
            />

            {/* Carte Entreprise - ✅ CORRECTION : Prix "Dès..." et message adapté */}
            <OptionCard 
              delay={0.6}
              icon={Zap}
              title="Pour les Pros"
              price="Tarifs Dégressifs" // ✅ Plus de "89 CHF"
              desc="Récompensez vos collaborateurs ou clients. Facturation pro et gestion simplifiée."
              btnText="Simuler le prix"
              link="/pricing" // ✅ Plus de "?type=company"
              color="bg-purple-500"
            />

          </div>
        </div>
      </section>

      {/* FOOTER SIMPLE (Placeholder) */}
      <footer className="bg-gray-900 py-12 text-white text-center">
        <p>© 2026 PEP'S Swiss SA. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

// Composant Carte réutilisable
const OptionCard = ({ delay, icon: Icon, title, price, desc, btnText, link, color, featured }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`relative flex flex-col rounded-2xl bg-white p-8 shadow-xl transition-all hover:shadow-2xl ${featured ? 'ring-4 ring-teal-500/20' : ''}`}
  >
    <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl ${color} text-white shadow-lg`}>
      <Icon size={28} />
    </div>
    <h3 className="mb-2 text-2xl font-bold text-gray-900">{title}</h3>
    <div className="mb-4 text-xl font-bold text-teal-600">{price}</div>
    <p className="mb-8 flex-grow text-gray-600">{desc}</p>
    <Link 
      to={link}
      className="inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
    >
      {btnText} <ArrowRight className="ml-2 h-4 w-4" />
    </Link>
  </motion.div>
);

export default HomePage;
