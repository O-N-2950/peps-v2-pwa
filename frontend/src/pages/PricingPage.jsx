import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Check, Star, ArrowRight, Zap, Users } from 'lucide-react';
import axios from 'axios';

// ==========================================
// GRILLE TARIFAIRE (Affichage seulement)
// ==========================================
const PRICING_DISPLAY = [
  { access: 1, price: 49, highlight: false },
  { access: 2, price: 89, highlight: false },
  { access: 3, price: 129, highlight: false },
  { access: 5, price: 199, highlight: true, badge: "POPULAIRE" },
  { access: 10, price: 390, highlight: false },
  { access: 20, price: 700, highlight: false },
  { access: 50, price: 1500, highlight: false },
  { access: 100, price: 2500, highlight: false },
];

// ==========================================
// COMPOSANT : CARTE DE PACK
// ==========================================
const PricingCard = ({ pack, onSelect, loading }) => {
  const pricePerAccess = (pack.price / pack.access).toFixed(2);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`relative bg-gray-800 rounded-2xl p-6 ${
        pack.highlight 
          ? 'border-2 border-[#E76F51] transform scale-105 shadow-2xl z-10' 
          : 'border border-gray-700'
      }`}
    >
      {/* Badge */}
      {pack.badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E76F51] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md animate-pulse">
          {pack.badge}
        </div>
      )}
      
      {/* Nombre d'accès */}
      <div className="text-gray-400 font-bold uppercase text-sm mb-2">
        {pack.access} Accès
      </div>
      
      {/* Prix */}
      <div className="text-4xl font-black mb-1 text-white">
        {pack.price} CHF
      </div>
      <div className="text-xs text-gray-500 mb-2">/ an</div>
      <div className="text-sm text-[#2A9D8F] font-bold mb-6">
        {pricePerAccess} CHF / accès
      </div>
      
      {/* Avantages */}
      <ul className="text-sm text-gray-300 space-y-2 mb-6 text-left">
        <li className="flex gap-2">
          <Check size={16} className="text-[#2A9D8F] shrink-0 mt-0.5" /> 
          {pack.access} {pack.access === 1 ? 'Compte' : 'Comptes'}
        </li>
        <li className="flex gap-2">
          <Check size={16} className="text-[#2A9D8F] shrink-0 mt-0.5" /> 
          Carte Digitale
        </li>
        <li className="flex gap-2">
          <Check size={16} className="text-[#2A9D8F] shrink-0 mt-0.5" /> 
          100+ Partenaires
        </li>
        <li className="flex gap-2">
          <Check size={16} className="text-[#2A9D8F] shrink-0 mt-0.5" /> 
          Privilèges exclusifs
        </li>
      </ul>
      
      {/* Bouton */}
      <button
        onClick={() => onSelect(pack.access)}
        disabled={loading}
        className="w-full bg-white text-gray-900 font-bold py-3 rounded-xl hover:bg-[#2A9D8F] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? 'Chargement...' : 'Choisir'}
        {!loading && <ArrowRight size={18} />}
      </button>
    </motion.div>
  );
};

// ==========================================
// PAGE PRINCIPALE
// ==========================================
export default function PricingPage() {
  const [packSize, setPackSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [pricingData, setPricingData] = useState([]);

  // Charger la grille tarifaire depuis l'API
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await axios.get('/api/stripe/pricing');
        setPricingData(response.data);
      } catch (error) {
        console.error('Erreur chargement tarifs:', error);
        // Fallback sur les données locales
        setPricingData(PRICING_DISPLAY.map(p => ({
          access_count: p.access,
          price: p.price,
          price_per_access: (p.price / p.access).toFixed(2),
          popular: p.highlight
        })));
      }
    };
    fetchPricing();
  }, []);

  // Fonction pour estimer le prix (pour le calculateur)
  const estimatePrice = (n) => {
    if (n >= 5000) return n * 8;
    if (n >= 2500) return 25000;
    if (n >= 1000) return 12000;
    if (n >= 750) return 9000;
    if (n >= 500) return 7500;
    if (n >= 400) return 7200;
    if (n >= 300) return 5400;
    if (n >= 200) return 4000;
    if (n >= 150) return 3300;
    if (n >= 100) return 2500;
    if (n >= 75) return 2000;
    if (n >= 50) return 1500;
    if (n >= 40) return 1280;
    if (n >= 30) return 1000;
    if (n >= 25) return 850;
    if (n >= 20) return 700;
    if (n >= 15) return 550;
    if (n >= 12) return 460;
    if (n >= 10) return 390;
    if (n >= 9) return 360;
    if (n >= 8) return 330;
    if (n >= 7) return 289;
    if (n >= 6) return 245;
    if (n >= 5) return 199;
    if (n >= 4) return 164;
    if (n >= 3) return 129;
    if (n >= 2) return 89;
    return 49;
  };

  // Gérer le checkout
  const handleCheckout = async (qty) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Si pas connecté, rediriger vers l'inscription
    if (!token) {
      window.location.href = `/register?redirect=checkout&pack=${qty}`;
      return;
    }

    try {
      const response = await axios.post(
        '/api/stripe/create-checkout-session',
        { pack_size: qty, currency: 'CHF' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Erreur checkout:', error);
      alert(error.response?.data?.error || "Erreur lors de la création de la session de paiement");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white py-20 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            Choisissez votre Pack PEP'S
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Tarifs dégressifs de 1 à 5000 accès. Plus vous prenez d'accès, moins vous payez par accès !
          </p>
        </motion.div>

        {/* CALCULATEUR DYNAMIQUE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-16 border border-white/10 max-w-3xl mx-auto shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="text-[#E76F51]" size={32} />
            <h3 className="text-2xl font-bold">Simulateur rapide</h3>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Slider */}
            <div className="w-full">
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Nombre d'accès souhaités : 
                <span className="text-white text-2xl ml-2">{packSize}</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={packSize} 
                onChange={(e) => setPackSize(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#2A9D8F]"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
            
            {/* Prix estimé */}
            <div className="text-right min-w-[200px]">
              <div className="text-5xl font-black text-[#2A9D8F] mb-2">
                ~{estimatePrice(packSize)} CHF
              </div>
              <div className="text-sm text-gray-400 mb-4">
                ~{(estimatePrice(packSize) / packSize).toFixed(2)} CHF / accès
              </div>
              <button 
                onClick={() => handleCheckout(packSize)}
                disabled={loading}
                className="mt-2 bg-[#E76F51] hover:bg-[#d65f41] text-white px-6 py-3 rounded-lg font-bold transition shadow-lg w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? '...' : (
                  <>
                    <Zap size={18} />
                    Choisir {packSize} accès
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* GRILLE DE PACKS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-black text-center mb-8">
            Packs les plus populaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {PRICING_DISPLAY.map((pack) => (
              <PricingCard 
                key={pack.access} 
                pack={pack} 
                onSelect={handleCheckout}
                loading={loading}
              />
            ))}
          </div>
        </motion.div>

        {/* PACK PERSONNALISÉ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-[#2A9D8F]/20 to-[#E76F51]/20 border border-white/10 rounded-3xl p-8 text-center max-w-3xl mx-auto mb-16"
        >
          <Users size={48} className="text-[#2A9D8F] mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Pack Personnalisé (>5000 accès)</h3>
          <p className="text-gray-400 mb-6">
            Besoin de plus de 5000 accès ? Contactez-nous pour un devis sur mesure adapté à vos besoins.
          </p>
          <a href="mailto:contact@peps.swiss">
            <button className="bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-[#2A9D8F] hover:text-white transition">
              Demander un devis
            </button>
          </a>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-black text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-4">
            <details className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 group">
              <summary className="font-bold cursor-pointer text-lg">
                Puis-je changer de pack ?
              </summary>
              <p className="text-gray-400 mt-4">
                Oui, vous pouvez upgrader ou downgrader votre pack à tout moment. La différence sera calculée au prorata.
              </p>
            </details>
            
            <details className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 group">
              <summary className="font-bold cursor-pointer text-lg">
                Que se passe-t-il si je n'utilise pas tous mes accès ?
              </summary>
              <p className="text-gray-400 mt-4">
                Les accès non utilisés restent disponibles pendant toute la durée de votre abonnement annuel.
              </p>
            </details>
            
            <details className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 group">
              <summary className="font-bold cursor-pointer text-lg">
                Les prix incluent-ils la TVA ?
              </summary>
              <p className="text-gray-400 mt-4">
                Oui, tous les prix affichés sont TTC (TVA incluse si applicable selon votre pays).
              </p>
            </details>
            
            <details className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 group">
              <summary className="font-bold cursor-pointer text-lg">
                Puis-je partager mes accès ?
              </summary>
              <p className="text-gray-400 mt-4">
                Oui ! Vous pouvez assigner vos accès à vos proches, employés, ou membres de votre équipe via votre dashboard.
              </p>
            </details>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
