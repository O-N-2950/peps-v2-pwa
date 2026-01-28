import { useState, useEffect } from 'react';
import { Star, Clock, CheckCircle, MessageSquare, X } from 'lucide-react';

/**
 * MemberActiveScreen - Écran MEMBRE ACTIF
 * 
 * Affiche l'écran de validation du privilège activé avec :
 * - Code de validation 8 caractères (gros et centré)
 * - Animation d'étoiles tombantes
 * - Horloge temps réel (anti-screenshot)
 * - Informations du partenaire
 * - Formulaire de feedback (5 étoiles + commentaire)
 */
export default function MemberActiveScreen({ activation, partner, onClose, onFeedbackSubmit }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stars, setStars] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Horloge temps réel (mise à jour chaque seconde)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Animation d'étoiles tombantes
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 20; i++) {
        newStars.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 2,
          duration: 2 + Math.random() * 2,
          size: 10 + Math.random() * 20
        });
      }
      setStars(newStars);
    };

    generateStars();
    const interval = setInterval(generateStars, 4000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-CH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleFeedbackSubmit = async () => {
    if (rating === 0) {
      alert('Veuillez sélectionner une note');
      return;
    }

    setSubmitting(true);

    try {
      await onFeedbackSubmit({
        activation_id: activation.id,
        rating,
        comment: comment.trim() || null,
        savings_amount: savingsAmount ? parseFloat(savingsAmount) : null
      });

      setShowFeedback(false);
      setRating(0);
      setComment('');
      setSavingsAmount('');
    } catch (error) {
      console.error('Erreur soumission feedback:', error);
      alert('Erreur lors de l\'envoi du feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 z-50 overflow-hidden">
      {/* Animation d'étoiles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute animate-fall"
            style={{
              left: `${star.left}%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`
            }}
          >
            <Star
              className="text-yellow-300 fill-yellow-300"
              style={{ width: `${star.size}px`, height: `${star.size}px` }}
            />
          </div>
        ))}
      </div>

      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Horloge temps réel */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 mb-8">
          <div className="flex items-center space-x-3 text-white">
            <Clock className="w-5 h-5" />
            <div className="text-center">
              <div className="text-3xl font-bold font-mono">{formatTime(currentTime)}</div>
              <div className="text-sm opacity-80">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>

        {/* Badge MEMBRE ACTIF */}
        <div className="bg-white/20 backdrop-blur-sm rounded-full px-8 py-3 mb-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-300" />
            <span className="text-white text-xl font-bold">MEMBRE ACTIF</span>
          </div>
        </div>

        {/* Code de validation */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 max-w-md w-full">
          <h2 className="text-center text-gray-600 text-sm font-semibold mb-4 uppercase tracking-wide">
            Code de validation
          </h2>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-4">
            <div className="text-center text-5xl font-bold font-mono tracking-widest text-purple-900">
              {activation.validation_code}
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm">
            Présentez ce code au partenaire pour bénéficier de votre privilège
          </p>
        </div>

        {/* Informations partenaire */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 mb-6 max-w-md w-full">
          <h3 className="text-lg font-bold text-gray-800 mb-3">{partner.name}</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Adresse :</strong> {partner.address}</p>
            <p><strong>Privilège :</strong> {activation.offer_name}</p>
            <p><strong>Valide jusqu'à :</strong> {new Date(activation.expires_at).toLocaleString('fr-CH')}</p>
          </div>
        </div>

        {/* Bouton feedback */}
        {!showFeedback && !activation.feedback_rating && (
          <button
            onClick={() => setShowFeedback(true)}
            className="bg-white text-purple-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Donner mon avis (+10 points)</span>
          </button>
        )}

        {/* Formulaire de feedback */}
        {showFeedback && (
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Votre avis compte !</h3>
            
            {/* Étoiles de notation */}
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      value <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Saisie de l'économie réalisée */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💰 Combien avez-vous économisé ? (optionnel)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border-2 border-purple-300 rounded-lg p-3 pr-16 text-lg font-semibold text-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                  CHF
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Indiquez le montant que vous avez économisé grâce à ce privilège
              </p>
            </div>

            {/* Commentaire optionnel */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Commentaire (optionnel)"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-sm resize-none"
              rows="3"
            />

            {/* Boutons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                onClick={handleFeedbackSubmit}
                className="flex-1 bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={submitting || rating === 0}
              >
                {submitting ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        )}

        {/* Feedback déjà soumis */}
        {activation.feedback_rating && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 max-w-md w-full">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Merci pour votre avis !</span>
            </div>
            <div className="flex items-center space-x-1 mt-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={`w-5 h-5 ${
                    value <= activation.feedback_rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            {activation.feedback_comment && (
              <p className="text-sm text-gray-700 mt-2 italic">"{activation.feedback_comment}"</p>
            )}
            <p className="text-sm text-green-700 mt-2">+{activation.feedback_points_awarded} points PEP's</p>
          </div>
        )}
      </div>

      {/* CSS pour l'animation des étoiles */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
}
