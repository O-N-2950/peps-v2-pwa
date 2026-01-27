import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const FlashOffersWidget = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({});
  const carouselRef = useRef(null);
  const autoScrollInterval = useRef(null);

  // Charger les offres flash depuis l'API
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await axios.get('https://www.peps.swiss/api/member/offers/flash');
        setOffers(response.data || []);
      } catch (error) {
        console.error('Erreur chargement offres flash:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  // Calculer le temps restant pour chaque offre
  useEffect(() => {
    if (offers.length === 0) return;

    const updateTimers = () => {
      const newTimeLeft = {};
      offers.forEach(offer => {
        const now = new Date();
        const end = new Date(offer.end_time);
        const diff = end - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          newTimeLeft[offer.id] = { hours, minutes, seconds };
        } else {
          newTimeLeft[offer.id] = { hours: 0, minutes: 0, seconds: 0 };
        }
      });
      setTimeLeft(newTimeLeft);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [offers]);

  // Auto-scroll toutes les 5 secondes
  useEffect(() => {
    if (offers.length <= 1) return;

    autoScrollInterval.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 5000);

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [offers.length]);

  // Navigation manuelle
  const handlePrev = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const handleNext = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  // Réserver une offre
  const handleReserve = async (offerId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await axios.post(
        `https://www.peps.swiss/api/member/offers/flash/${offerId}/reserve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('🎉 Réservation confirmée ! Vous recevrez un email de confirmation.');
        // Recharger les offres pour mettre à jour le stock
        const updatedOffers = await axios.get('https://www.peps.swiss/api/member/offers/flash');
        setOffers(updatedOffers.data || []);
      }
    } catch (error) {
      console.error('Erreur réservation:', error);
      alert(error.response?.data?.error || 'Erreur lors de la réservation');
    }
  };

  if (loading) {
    return (
      <div className="py-12 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-white">
            <Zap className="animate-pulse mx-auto mb-4" size={48} />
            <p className="text-xl">Chargement des offres flash...</p>
          </div>
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas d'offres
  }

  return (
    <section className="py-16 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 relative overflow-hidden">
      {/* Fond animé */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-yellow-400 rounded-full opacity-10 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-pink-400 rounded-full opacity-10 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Titre de la section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Zap className="text-yellow-400" size={48} />
            </motion.div>
            <h2 className="text-5xl font-extrabold text-white">
              Offres Flash du Moment
            </h2>
          </div>
          <p className="text-xl text-purple-100">
            Profitez des meilleures offres avant qu'elles n'expirent !
          </p>
        </motion.div>

        {/* Carrousel */}
        <div className="relative">
          {/* Bouton Précédent */}
          {offers.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-all duration-300 -ml-4 md:-ml-6"
            >
              <ChevronLeft className="text-white" size={24} />
            </button>
          )}

          {/* Conteneur du carrousel */}
          <div ref={carouselRef} className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {/* Afficher 3 offres à la fois (ou moins si pas assez) */}
                {offers.slice(currentIndex, currentIndex + 3).map((offer, index) => (
                  <FlashOfferCard
                    key={offer.id}
                    offer={offer}
                    timeLeft={timeLeft[offer.id]}
                    onReserve={() => handleReserve(offer.id)}
                    delay={index * 0.1}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bouton Suivant */}
          {offers.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-all duration-300 -mr-4 md:-mr-6"
            >
              <ChevronRight className="text-white" size={24} />
            </button>
          )}
        </div>

        {/* Indicateurs de pagination */}
        {offers.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {offers.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Lien "Voir toutes les offres" */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <a
            href="/flash-offers"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-700 font-bold rounded-full hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <TrendingUp size={20} />
            Voir toutes les offres flash
          </a>
        </motion.div>
      </div>
    </section>
  );
};

// Composant pour une carte d'offre flash
const FlashOfferCard = ({ offer, timeLeft, onReserve, delay }) => {
  const stockPercentage = (offer.available_slots / offer.total_slots) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border border-white/20"
    >
      {/* Badge FLASH */}
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-4 right-4 z-10"
        >
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <Zap size={14} />
            FLASH
          </div>
        </motion.div>
      </div>

      {/* Contenu */}
      <div className="p-6 text-white">
        {/* Nom du partenaire */}
        <h3 className="text-2xl font-bold mb-2">{offer.partner_name}</h3>
        <p className="text-sm text-purple-200 mb-4">
          📍 {offer.partner_city} • {offer.partner_category}
        </p>

        {/* Réduction */}
        <div className="text-5xl font-extrabold text-yellow-400 mb-2">
          -{offer.discount_percentage}%
        </div>

        {/* Titre de l'offre */}
        <h4 className="text-xl font-semibold mb-2">{offer.title}</h4>
        <p className="text-sm text-purple-100 mb-4">{offer.description}</p>

        {/* Barre de progression du stock */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>{offer.available_slots} / {offer.total_slots} disponibles</span>
            <span>{Math.round(stockPercentage)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stockPercentage}%` }}
              transition={{ duration: 1, delay: delay + 0.3 }}
              className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full"
            />
          </div>
        </div>

        {/* Compte à rebours */}
        {timeLeft && (
          <div className="flex items-center justify-center gap-2 mb-4 bg-white/10 rounded-lg py-2">
            <Clock size={16} className="text-yellow-400" />
            <span className="text-sm font-semibold">
              Expire dans {timeLeft.hours}h {timeLeft.minutes}min {timeLeft.seconds}s
            </span>
          </div>
        )}

        {/* Bouton Réserver */}
        <motion.button
          onClick={onReserve}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold py-3 rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
        >
          <Zap size={18} />
          Réserver maintenant
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FlashOffersWidget;
