import { useState } from 'react';
import { AlertTriangle, CreditCard, Calendar, CheckCircle, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * SubscriptionExpiredScreen - Écran ABONNEMENT EXPIRÉ
 * 
 * Affiche un écran rouge d'alerte lorsque l'abonnement est expiré avec :
 * - Message d'alerte clair
 * - Date d'expiration
 * - Bouton de renouvellement Stripe Checkout
 * - Prolongation automatique +1 an après paiement
 * - Design rouge/orange pour urgence
 */
export default function SubscriptionExpiredScreen({ subscription, onClose, onRenewed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRenew = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Créer une session Stripe Checkout pour le renouvellement
      const response = await fetch(`${API_URL}/api/stripe/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pack_id: subscription.pack_id || 1, // Pack par défaut
          renewal: true
        })
      });

      const data = await response.json();

      if (data.success && data.checkout_url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        setError(data.error || 'Erreur lors de la création de la session de paiement');
      }
    } catch (err) {
      console.error('Erreur renouvellement:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysExpired = () => {
    if (!subscription.current_period_end) return 0;
    const expiredDate = new Date(subscription.current_period_end);
    const now = new Date();
    const diffTime = Math.abs(now - expiredDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-900 via-red-700 to-orange-600 z-50 overflow-hidden">
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Icône d'alerte animée */}
        <div className="mb-8 animate-pulse">
          <div className="bg-white rounded-full p-6">
            <AlertTriangle className="w-24 h-24 text-red-600" />
          </div>
        </div>

        {/* Message principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 max-w-md w-full">
          <h1 className="text-3xl font-bold text-red-600 mb-4 text-center">
            Abonnement Expiré
          </h1>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-2">Votre abonnement a expiré</p>
                <p>
                  Vous ne pouvez plus activer de privilèges ni accéder aux avantages exclusifs PEP's.
                </p>
              </div>
            </div>
          </div>

          {/* Informations d'expiration */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Date d'expiration :</span>
              <span className="font-semibold text-gray-800">
                {formatDate(subscription.current_period_end)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Expiré depuis :</span>
              <span className="font-semibold text-red-600">
                {getDaysExpired()} jour{getDaysExpired() > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Avantages du renouvellement */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Renouvelez pour profiter de :
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Accès illimité aux privilèges exclusifs</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Économies garanties chez nos partenaires</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Programme de fidélité et points PEP's</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Offres flash et événements VIP</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="font-semibold text-purple-600">Prolongation +1 an</span>
              </li>
            </ul>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Bouton de renouvellement */}
          <button
            onClick={handleRenew}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Renouveler mon abonnement</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Paiement sécurisé par Stripe • Renouvellement automatique +1 an
          </p>
        </div>

        {/* Informations complémentaires */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md w-full">
          <div className="flex items-start space-x-3 text-white">
            <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Renouvellement automatique</p>
              <p className="opacity-90">
                Après paiement, votre abonnement sera automatiquement prolongé de 12 mois à partir de la date d'expiration.
              </p>
            </div>
          </div>
        </div>

        {/* Lien support */}
        <div className="mt-6 text-center">
          <a
            href="mailto:support@peps.swiss"
            className="text-white text-sm underline hover:no-underline"
          >
            Besoin d'aide ? Contactez notre support
          </a>
        </div>
      </div>

      {/* Animation de pulsation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
