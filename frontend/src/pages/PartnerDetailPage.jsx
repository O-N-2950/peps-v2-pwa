import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Star, 
  Gift, 
  ArrowLeft,
  ExternalLink,
  Share2,
  Store,
  Sparkles,
  CheckCircle,
  X
} from 'lucide-react';

/**
 * Page de détail d'un partenaire avec liste complète des privilèges
 * et flow d'activation avec animation étoiles + vidéo Pepi
 */
const PartnerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [partner, setPartner] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStarsAnimation, setShowStarsAnimation] = useState(false);
  const [showPepiVideo, setShowPepiVideo] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activatedOffer, setActivatedOffer] = useState(null);
  const [validationCode, setValidationCode] = useState('');
  
  // État du feedback
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [savingsAmount, setSavingsAmount] = useState('');

  // Charger les données du partenaire
  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const response = await fetch(`/api/partners/${id}`);
        const data = await response.json();
        
        if (data.success) {
          setPartner(data.partner);
          setOffers(data.offers || []);
        } else {
          console.error('Erreur:', data.error);
        }
      } catch (error) {
        console.error('Erreur chargement partenaire:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [id]);

  // Fonction pour activer un privilège
  const handleActivatePrivilege = async (offerId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vous devez être connecté pour activer un privilège');
        navigate('/login');
        return;
      }

      const response = await fetch('/api/privileges/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partner_id: parseInt(id),
          offer_id: offerId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Stocker les infos de l'activation
        setActivatedOffer(data.activation);
        setValidationCode(data.activation.validation_code);
        
        // Lancer l'animation des étoiles
        setShowStarsAnimation(true);
        
        // Après 2 secondes, afficher la vidéo Pepi
        setTimeout(() => {
          setShowStarsAnimation(false);
          setShowPepiVideo(true);
        }, 2000);
        
        // Après 5 secondes, proposer le feedback
        setTimeout(() => {
          setShowPepiVideo(false);
          setShowFeedbackModal(true);
        }, 7000);
      } else {
        alert(data.message || data.error || 'Erreur lors de l\'activation');
      }
    } catch (error) {
      console.error('Erreur activation privilège:', error);
      alert('Erreur lors de l\'activation du privilège');
    }
  };

  // Fonction pour soumettre le feedback
  const handleSubmitFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/privileges/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partner_id: parseInt(id),
          offer_id: activatedOffer?.id,
          rating: rating,
          comment: comment,
          experience_type: rating >= 4 ? 'excellent_service' : 'privilege_granted',
          savings_amount: savingsAmount ? parseFloat(savingsAmount) : null
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Merci pour votre feedback !');
        setShowFeedbackModal(false);
        // Réinitialiser le formulaire
        setRating(0);
        setComment('');
        setSavingsAmount('');
      } else {
        alert('Erreur lors de l\'envoi du feedback');
      }
    } catch (error) {
      console.error('Erreur soumission feedback:', error);
      alert('Erreur lors de l\'envoi du feedback');
    }
  };

  // Fonction pour ignorer le feedback
  const handleSkipFeedback = () => {
    setShowFeedbackModal(false);
    setRating(0);
    setComment('');
    setSavingsAmount('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A9D8F]/10 to-[#E76F51]/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#2A9D8F] border-t-transparent"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A9D8F]/10 to-[#E76F51]/10 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Partenaire introuvable</h2>
          <button
            onClick={() => navigate('/map')}
            className="px-6 py-3 bg-[#2A9D8F] text-white rounded-lg hover:bg-[#238276] transition"
          >
            Retour à la carte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A9D8F]/10 to-[#E76F51]/10">
      {/* Animation étoiles multicolores */}
      <AnimatePresence>
        {showStarsAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="relative">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: Math.cos((i * 2 * Math.PI) / 20) * 200,
                    y: Math.sin((i * 2 * Math.PI) / 20) * 200,
                  }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                >
                  <Star
                    size={40}
                    className="fill-current"
                    style={{
                      color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][i % 5]
                    }}
                  />
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center text-white"
              >
                <Sparkles size={80} className="mx-auto mb-4" />
                <h2 className="text-3xl font-bold">Privilège activé !</h2>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vidéo Pepi */}
      <AnimatePresence>
        {showPepiVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <div className="relative max-w-2xl w-full mx-4">
              <video
                autoPlay
                className="w-full rounded-2xl shadow-2xl"
                onEnded={() => {
                  setShowPepiVideo(false);
                  setShowFeedbackModal(true);
                }}
              >
                <source src="/videos/pepi-celebration.mp4" type="video/mp4" />
              </video>
              <button
                onClick={() => {
                  setShowPepiVideo(false);
                  setShowFeedbackModal(true);
                }}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Feedback */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Code de validation
                </h3>
                <div className="bg-[#2A9D8F] text-white text-3xl font-bold py-4 px-6 rounded-xl mb-4">
                  {validationCode}
                </div>
                <p className="text-sm text-gray-600">
                  Montrez ce code au partenaire pour bénéficier de votre privilège
                </p>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-bold text-gray-900 mb-4">
                  Comment s'est passée votre expérience ? (optionnel)
                </h4>

                {/* Rating étoiles */}
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>

                {/* Commentaire */}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Votre commentaire (optionnel)..."
                  className="w-full p-3 border border-gray-300 rounded-lg mb-3 resize-none"
                  rows="3"
                />

                {/* Montant économisé */}
                <input
                  type="number"
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(e.target.value)}
                  placeholder="Montant économisé en CHF (optionnel)"
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                />

                {/* Boutons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSkipFeedback}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Passer
                  </button>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={rating === 0}
                    className={`flex-1 py-3 rounded-lg transition ${
                      rating === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#2A9D8F] text-white hover:bg-[#238276]'
                    }`}
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header avec image de fond */}
      <div className="relative h-64 bg-gradient-to-r from-[#2A9D8F] to-[#E76F51]">
        {partner.image_url && (
          <img 
            src={partner.image_url} 
            alt={partner.name}
            className="w-full h-full object-cover opacity-50"
          />
        )}
        
        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition"
        >
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>

        {/* Bouton partager */}
        <button
          className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition"
        >
          <Share2 className="w-6 h-6 text-gray-800" />
        </button>

        {/* Logo partenaire */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center overflow-hidden border-4 border-white">
            {partner.logo ? (
              <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-12 h-12 text-[#2A9D8F]" />
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-8">
        {/* Nom et catégorie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{partner.name}</h1>
          <p className="text-lg text-gray-600">{partner.category}</p>
          
          {/* Note */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-800">4.8</span>
            <span className="text-gray-600">(127 avis)</span>
          </div>
        </motion.div>

        {/* Liste des privilèges exclusifs */}
        {offers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6 text-[#E76F51]" />
              Privilèges Exclusifs PEP'S
            </h2>
            
            <div className="space-y-4">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="bg-gradient-to-r from-[#2A9D8F] to-[#E76F51] rounded-2xl p-6 text-white shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                      {offer.description && (
                        <p className="text-white/90 mb-2">{offer.description}</p>
                      )}
                      {offer.conditions && (
                        <p className="text-sm text-white/80 italic">
                          Conditions: {offer.conditions}
                        </p>
                      )}
                    </div>
                    {offer.discount_val && (
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center flex-shrink-0">
                        <div className="text-2xl font-bold">{offer.discount_val}</div>
                        <div className="text-xs">de réduction</div>
                      </div>
                    )}
                  </div>

                  {/* Bouton d'activation */}
                  <button
                    onClick={() => handleActivatePrivilege(offer.id)}
                    className="w-full py-4 bg-white text-[#2A9D8F] rounded-xl font-bold text-lg hover:scale-105 hover:shadow-2xl active:scale-95 transition-all transform"
                  >
                    ✨ Activer ce privilège
                  </button>

                  {/* Infos validité */}
                  {(offer.valid_until || offer.max_uses_per_member) && (
                    <div className="mt-3 text-xs text-white/70 flex gap-4">
                      {offer.valid_until && (
                        <span>Valide jusqu'au {new Date(offer.valid_until).toLocaleDateString('fr-CH')}</span>
                      )}
                      {offer.max_uses_per_member && (
                        <span>Max {offer.max_uses_per_member} utilisations</span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Informations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Informations</h3>
          
          <div className="space-y-4">
            {/* Adresse */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#2A9D8F] flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-gray-900">Adresse</p>
                <p className="text-gray-600">
                  {partner.address || `${partner.address_street}, ${partner.address_postal_code} ${partner.address_city}`}
                </p>
              </div>
            </div>

            {/* Téléphone */}
            {partner.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#2A9D8F] flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Téléphone</p>
                  <a href={`tel:${partner.phone}`} className="text-[#2A9D8F] hover:underline">
                    {partner.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Horaires */}
            {partner.opening_hours && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#2A9D8F] flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Horaires</p>
                  <p className="text-gray-600 whitespace-pre-line">{partner.opening_hours}</p>
                </div>
              </div>
            )}

            {/* Site web */}
            {partner.website && (
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-[#2A9D8F] flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Site web</p>
                  <a 
                    href={partner.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#2A9D8F] hover:underline"
                  >
                    Visiter le site
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PartnerDetailPage;
