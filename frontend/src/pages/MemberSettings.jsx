import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MemberSettings = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/member/subscription-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscription(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/member/cancel-subscription', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(response.data.message);
      setShowCancelModal(false);
      fetchSubscriptionStatus();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la résiliation');
    } finally {
      setCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/member/reactivate-subscription', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(response.data.message);
      fetchSubscriptionStatus();
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la réactivation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center"
          >
            ← Retour au dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        </div>

        {/* Abonnement */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Mon abonnement</h2>
          
          {!subscription?.has_subscription ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Vous n'avez pas d'abonnement actif</p>
              <button
                onClick={() => navigate('/subscribe')}
                className="btn-primary"
              >
                S'abonner maintenant
              </button>
            </div>
          ) : (
            <div>
              {/* Statut */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">Statut</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                    subscription.status === 'canceling' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription.status === 'active' ? 'Actif' :
                     subscription.status === 'canceling' ? 'En cours de résiliation' :
                     subscription.status}
                  </span>
                </div>
                
                {subscription.current_period_end && (
                  <p className="text-sm text-gray-600">
                    {subscription.is_canceling ? 
                      `Accès jusqu'au ${subscription.access_until}` :
                      `Prochaine échéance : ${subscription.access_until}`
                    }
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="border-t pt-6">
                {subscription.is_canceling ? (
                  <div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <p className="text-orange-800 text-sm">
                        ⚠️ Votre abonnement sera résilié le {subscription.access_until}. 
                        Vous conservez l'accès jusqu'à cette date.
                      </p>
                    </div>
                    <button
                      onClick={handleReactivateSubscription}
                      className="btn-primary w-full"
                    >
                      Réactiver mon abonnement
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="btn-danger w-full"
                  >
                    Résilier mon abonnement
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Autres paramètres */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Autres paramètres</h2>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/profile')}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="font-medium">Modifier mon profil</span>
              <span className="text-gray-500 text-sm block">Prénom, nom, email, téléphone</span>
            </button>
            <button
              onClick={() => navigate('/change-password')}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="font-medium">Changer mon mot de passe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modale de confirmation résiliation */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirmer la résiliation
            </h3>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium mb-2">
                ⚠️ Attention
              </p>
              <p className="text-red-700 text-sm">
                Votre abonnement sera résilié à la prochaine échéance ({subscription?.access_until}).
              </p>
              <p className="text-red-700 text-sm mt-2">
                Vous conserverez l'accès jusqu'à cette date, mais aucun renouvellement automatique ne sera effectué.
              </p>
            </div>

            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir résilier votre abonnement PEP's ?
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 btn-secondary"
                disabled={canceling}
              >
                Annuler
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 btn-danger"
                disabled={canceling}
              >
                {canceling ? 'Résiliation...' : 'Confirmer la résiliation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSettings;
