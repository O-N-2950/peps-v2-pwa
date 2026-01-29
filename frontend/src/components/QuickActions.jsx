import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QuickActions({ role = 'member', onOpenFlashModal, onOpenNotificationModal }) {
  const navigate = useNavigate();
  const [flashOffersCount, setFlashOffersCount] = useState(0);
  const [newPartnersCount, setNewPartnersCount] = useState(0);

  useEffect(() => {
    // Charger le nombre d'offres flash disponibles
    fetchFlashOffersCount();
    // Charger le nombre de nouveaux partenaires
    fetchNewPartnersCount();
  }, []);

  const fetchFlashOffersCount = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/offers/flash`);
      const data = await response.json();
      if (data.success) {
        setFlashOffersCount(data.offers.length);
      }
    } catch (error) {
      console.error('Erreur chargement offres flash:', error);
    }
  };

  const fetchNewPartnersCount = async () => {
    try {
      // Simuler le nombre de nouveaux partenaires (à remplacer par un vrai endpoint)
      setNewPartnersCount(125);
    } catch (error) {
      console.error('Erreur chargement nouveaux partenaires:', error);
    }
  };

  // Actions pour les membres
  const memberActions = [
    {
      id: 'map',
      icon: '🗺️',
      title: 'EXPLORER LA CARTE',
      description: `${newPartnersCount} nouveaux partenaires cette semaine`,
      path: '/map',
      buttonText: 'Voir la carte',
      buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    {
      id: 'flash',
      icon: '⚡',
      title: 'SAISIR UNE FLASH',
      description: `${flashOffersCount} offre${flashOffersCount > 1 ? 's' : ''} disponible${flashOffersCount > 1 ? 's' : ''} maintenant !`,
      path: '/flash-offers',
      buttonText: 'Voir les offres',
      buttonClass: 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white',
      badge: flashOffersCount > 0 ? `${flashOffersCount} DISPONIBLE${flashOffersCount > 1 ? 'S' : ''}` : null,
    },
  ];

  // Actions pour les partenaires (redesignées selon specs)
  const partnerActions = [
    {
      id: 'create-flash',
      icon: '⚡',
      title: 'CRÉER OFFRE FLASH',
      description: 'Boostez votre visibilité en 2 clics',
      action: () => {
        if (onOpenFlashModal) {
          onOpenFlashModal();
        } else {
          navigate('/partner-dashboard?tab=push');
        }
      },
      buttonText: 'Créer maintenant',
      buttonClass: 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold',
      priority: 'high'
    },
    {
      id: 'manage-privileges',
      icon: '🎁',
      title: 'GÉRER PRIVILÈGES',
      description: 'Créer, modifier ou supprimer vos offres',
      action: () => {
        navigate('/partner-dashboard?tab=privileges');
      },
      buttonText: 'Voir mes privilèges',
      buttonClass: 'bg-teal-600 hover:bg-teal-700 text-white',
      priority: 'medium'
    },
    {
      id: 'send-notification',
      icon: '📣',
      title: 'NOTIFICATION PUSH',
      description: 'Alertez vos followers instantanément',
      action: () => {
        if (onOpenNotificationModal) {
          onOpenNotificationModal();
        } else {
          navigate('/partner-dashboard?tab=push');
        }
      },
      buttonText: 'Envoyer notification',
      buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
      priority: 'medium'
    },
    {
      id: 'view-bookings',
      icon: '📅',
      title: 'AGENDA & RÉSERVATIONS',
      description: 'Gérer vos rendez-vous et réservations',
      action: () => {
        navigate('/partner-dashboard?tab=agenda');
      },
      buttonText: 'Voir l\'agenda',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      priority: 'low'
    },
  ];

  const actions = role === 'partner' ? partnerActions : memberActions;

  const handleAction = (action) => {
    if (action.action) {
      action.action();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🎯</span>
        ACTIONS RAPIDES
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => (
          <div
            key={action.id}
            onClick={() => handleAction(action)}
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-4xl">{action.icon}</span>
              {action.badge ? (
                <span className="text-xs text-red-600 font-bold animate-pulse bg-red-100 px-2 py-1 rounded">
                  {action.badge}
                </span>
              ) : action.priority === 'high' ? (
                <span className="text-xs text-red-600 font-bold bg-red-100 px-2 py-1 rounded">
                  PRIORITÉ
                </span>
              ) : (
                <span className="text-sm text-purple-600 font-semibold group-hover:translate-x-1 transition-transform">
                  →
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {action.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {action.description}
            </p>
            <button className={`w-full py-2 rounded-lg transition-all ${action.buttonClass}`}>
              {action.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
