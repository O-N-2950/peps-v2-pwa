import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, CreditCard, Star, Shield } from 'lucide-react';
import axios from 'axios';

// ✅ TABLE DE PRIX EXACTE (Exemple basé sur la logique dégressive)
// Dans la réalité, remplacez ceci par les données venant de votre API /api/pricing
const EXACT_PRICING_TIERS = {
  1: 49,
  2: 89,
  3: 129, // Exemple
  5: 199,
  10: 390,
  20: 700,
  50: 1500,
  100: 2500,
  200: 4500,
  500: 7500
  // Ajoutez vos 28 paliers ici
};

// ✅ CARDS À AFFICHER (Sélection stratégique)
const DISPLAY_TIERS = [
  { access: 1, label: "Découverte" },
  { access: 2, label: "Duo" },
  { access: 5, label: "Famille", popular: true },
  { access: 10, label: "TPE / Équipe" },
  { access: 20, label: "PME" },
  { access: 50, label: "Entreprise" },
  { access: 100, label: "Grand Compte" },
  { access: 500, label: "Corporation" },
];

const PricingPage = () => {
  const [selectedAccess, setSelectedAccess] = useState(1);
  const [customAmount, setCustomAmount] = useState(5);
  const [loading, setLoading] = useState(false);

  // Fonction pour obtenir le prix exact (soit direct, soit interpolé/paliers)
  const getPrice = (qty) => {
    if (EXACT_PRICING_TIERS[qty]) return EXACT_PRICING_TIERS[qty];
    
    // Logique de repli si la quantité n'est pas un palier exact (ex: 7)
    // On prend le prix du palier inférieur le plus proche + le coût unitaire de ce palier pour le reste
    const tiers = Object.keys(EXACT_PRICING_TIERS).map(Number).sort((a, b) => a - b);
    const lowerTier = tiers.reverse().find(t => t <= qty) || 1;
    const priceLower = EXACT_PRICING_TIERS[lowerTier];
    
    // Calcul simpliste pour l'exemple (à affiner selon votre algorythme 28 paliers)
    // Ici : Prix de base + (différence * prix unitaire moyen du palier)
    const unitPrice = priceLower / lowerTier;
    return Math.round(priceLower + ((qty - lowerTier) * unitPrice));
  };

  const handleCheckout = async (qty, price) => {
    setLoading(true);
    try {
      // ✅ Appel Backend Stripe
      const { data } = await axios.post('/api/create-checkout-session', {
        quantity: qty,
        unit_amount: Math.round((price / qty) * 100), // En centimes, approximatif pour Stripe (mieux vaut passer le priceID si possible)
        // Note: Idéalement, le backend recalcule le prix total basé sur la qty pour sécurité
      });
      window.location.href = data.url;
    } catch (err) {
      console.error("Erreur paiement", err);
      alert("Une erreur est survenue.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* HEADER */}
      <div className="bg-teal-700 py-16 text-center text-white">
        <h1 className="mb-4 text-4xl font-extrabold">Un tarif unique, dégressif selon le volume</h1>
        <p className="mx-auto max-w-2xl text-xl text-teal-100">
          Que vous soyez un particulier ou une multinationale, le principe est le même :<br/>
          plus vous prenez d'accès, moins vous payez à l'unité.
        </p>
      </div>

      <div className="container mx-auto px-4 py-12">
        
        {/* CALCULATEUR INTELLIGENT */}
        <div className="mx-auto mb-20 max-w-3xl rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800">Simulateur de budget</h2>
            <p className="text-gray-500">Choisissez le nombre d'accès souhaité</p>
          </div>

          <div className="mb-8 px-4">
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={customAmount} 
              onChange={(e) => setCustomAmount(parseInt(e.target.value))}
              className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-teal-600"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span>50</span>
              <span>100+</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between rounded-xl bg-teal-50 p-6 sm:flex-row">
            <div className="mb-4 text-center sm:mb-0 sm:text-left">
              <span className="block text-sm font-semibold uppercase tracking-wide text-teal-600">Votre sélection</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-gray-900">{customAmount}</span>
                <span className="text-lg font-medium text-gray-600">accès</span>
              </div>
            </div>

            <div className="mb-4 text-center sm:mb-0 sm:text-right">
               <span className="block text-sm font-semibold uppercase tracking-wide text-teal-600">Total estimé</span>
               <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-gray-900">{getPrice(customAmount)}</span>
                <span className="text-lg font-medium text-gray-600">CHF</span>
              </div>
              <span className="text-xs text-gray-500">soit {Math.round(getPrice(customAmount)/customAmount)} CHF / accès</span>
            </div>

            <button 
              onClick={() => handleCheckout(customAmount, getPrice(customAmount))}
              disabled={loading}
              className="rounded-lg bg-teal-600 px-8 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-teal-700 disabled:opacity-70"
            >
              {loading ? '...' : 'Commander'}
            </button>
          </div>
        </div>

        {/* GRILLE TARIFAIRE - ✅ CORRECTION : Liste neutre et complète */}
        <div className="mb-12 text-center">
          <h3 className="text-2xl font-bold text-gray-800">Nos packs les plus populaires</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {DISPLAY_TIERS.map((tier) => {
            const price = getPrice(tier.access);
            const unitPrice = Math.round(price / tier.access);
            const isPopular = tier.popular;

            return (
              <motion.div
                key={tier.access}
                whileHover={{ y: -5 }}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-xl ${isPopular ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-gray-200'}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    POPULAIRE
                  </div>
                )}

                <div className="mb-4 text-center">
                  <span className="mb-1 block text-sm font-medium text-gray-500">{tier.label}</span>
                  <div className="text-3xl font-extrabold text-gray-900">{tier.access} <span className="text-lg font-medium text-gray-500">Accès</span></div>
                </div>

                <div className="mb-6 rounded-lg bg-gray-50 p-4 text-center">
                  <div className="text-2xl font-bold text-teal-700">{price} CHF</div>
                  <div className="text-sm text-gray-500">soit {unitPrice} CHF / accès</div>
                </div>

                <ul className="mb-6 space-y-3 flex-grow text-sm text-gray-600">
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-teal-500" /> Accès illimité 1 an</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-teal-500" /> +100 Partenaires</li>
                  {tier.access > 1 && (
                    <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-teal-500" /> Codes transférables</li>
                  )}
                  {tier.access >= 10 && (
                     <li className="flex items-center"><Star className="mr-2 h-4 w-4 text-orange-400" /> Facturation Pro</li>
                  )}
                </ul>

                <button
                  onClick={() => handleCheckout(tier.access, price)}
                  className={`w-full rounded-xl py-3 font-bold transition-colors ${isPopular ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                >
                  Choisir ce pack
                </button>
              </motion.div>
            );
          })}
        </div>
        
        {/* SECTION GROS VOLUMES */}
        <div className="mt-16 rounded-2xl bg-gray-900 p-8 text-center text-white">
          <h3 className="mb-2 text-2xl font-bold">Besoin de plus de 500 accès ?</h3>
          <p className="mb-6 text-gray-400">Pour les grandes collectivités ou revendeurs, contactez-nous pour une offre sur mesure.</p>
          <a href="mailto:contact@peps-jura.ch" className="inline-flex items-center rounded-lg bg-white px-6 py-3 font-bold text-gray-900 hover:bg-gray-100">
            Contacter l'équipe commerciale
          </a>
        </div>

      </div>
    </div>
  );
};

export default PricingPage;
