import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DCI from '../components/activation/DCI';
import MemberActiveScreen from '../components/activation/MemberActiveScreen';
import SubscriptionExpiredScreen from '../components/activation/SubscriptionExpiredScreen';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * ActivationPage - Page d'activation de privilège
 * 
 * Orchestration des 3 composants :
 * 1. Vérifie l'abonnement
 * 2. Affiche DCI si abonnement actif
 * 3. Affiche MemberActiveScreen après activation
 * 4. Affiche SubscriptionExpiredScreen si abonnement expiré
 */
export default function ActivationPage() {
  const { partnerId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [partner, setPartner] = useState(null);
  const [activation, setActivation] = useState(null);
  const [showActiveScreen, setShowActiveScreen] = useState(false);
  const [showExpiredScreen, setShowExpiredScreen] = useState(false);

  useEffect(() => {
    checkSubscriptionAndLoadData();
  }, [partnerId]);

  const checkSubscriptionAndLoadData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // 1. Vérifier l'abonnement
      const subResponse = await fetch(`${API_URL}/api/member/check-subscription`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subData = await subResponse.json();
      setSubscription(subData);

      // 2. Charger les données du partenaire
      const partnerResponse = await fetch(`${API_URL}/api/partners/${partnerId}`);
      const partnerData = await partnerResponse.json();
      setPartner(partnerData.partner);

      // 3. Afficher l'écran approprié
      if (!subData.active) {
        setShowExpiredScreen(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setLoading(false);
    }
  };

  const handleActivate = (activationData) => {
    setActivation(activationData);
    setShowActiveScreen(true);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/member/submit-feedback`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });

    const data = await response.json();

    if (data.success) {
      // Mettre à jour l'activation avec le feedback
      setActivation({
        ...activation,
        feedback_rating: feedbackData.rating,
        feedback_comment: feedbackData.comment,
        feedback_points_awarded: data.points_awarded
      });
    }

    return data;
  };

  const handleCloseActiveScreen = () => {
    setShowActiveScreen(false);
    navigate('/member-dashboard');
  };

  const handleCloseExpiredScreen = () => {
    setShowExpiredScreen(false);
    navigate('/member-dashboard');
  };

  const handleRenewed = () => {
    // Recharger les données après renouvellement
    checkSubscriptionAndLoadData();
    setShowExpiredScreen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Écran MEMBRE ACTIF (modal plein écran) */}
      {showActiveScreen && activation && partner && (
        <MemberActiveScreen
          activation={activation}
          partner={partner}
          onClose={handleCloseActiveScreen}
          onFeedbackSubmit={handleFeedbackSubmit}
        />
      )}

      {/* Écran ABONNEMENT EXPIRÉ (modal plein écran) */}
      {showExpiredScreen && subscription && (
        <SubscriptionExpiredScreen
          subscription={subscription}
          onClose={handleCloseExpiredScreen}
          onRenewed={handleRenewed}
        />
      )}

      {/* Contenu principal */}
      {!showActiveScreen && !showExpiredScreen && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* En-tête */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="text-purple-600 hover:text-purple-700 font-semibold mb-4"
            >
              ← Retour
            </button>
            
            {partner && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{partner.name}</h1>
                <p className="text-gray-600">{partner.address}</p>
                {partner.description && (
                  <p className="text-gray-700 mt-4">{partner.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Composant DCI */}
          {subscription && subscription.active && partner && (
            <DCI
              partnerId={parseInt(partnerId)}
              onActivate={handleActivate}
            />
          )}

          {/* Message si abonnement inactif */}
          {subscription && !subscription.active && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-red-800 mb-2">Abonnement inactif</h2>
              <p className="text-red-700 mb-4">
                Vous devez avoir un abonnement actif pour activer des privilèges.
              </p>
              <button
                onClick={() => setShowExpiredScreen(true)}
                className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors"
              >
                Renouveler mon abonnement
              </button>
            </div>
          )}

          {/* Informations complémentaires */}
          {partner && partner.offers && partner.offers.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Privilèges disponibles</h2>
              <div className="space-y-4">
                {partner.offers.map((offer) => (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">{offer.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{offer.description}</p>
                    {offer.discount && (
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {offer.discount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
