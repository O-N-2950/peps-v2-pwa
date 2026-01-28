import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SecondaryNav({ role = 'member', hasMemberSubscription = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Tabs pour les membres
  const memberTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/member-dashboard' },
    { id: 'map', label: 'Carte', icon: '🗺️', path: '/map' },
    { id: 'flash', label: 'Offres Flash', icon: '⚡', path: '/flash-offers' },
    { id: 'favorites', label: 'Favoris', icon: '⭐', path: '/map' },
  ];

  // Tabs pour les partenaires (nettoyées selon specs)
  const partnerTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/partner-dashboard' },
    { id: 'privileges', label: 'Privilèges', icon: '🎁', path: '/partner-dashboard?tab=privileges' },
    { id: 'push', label: 'Push', icon: '📣', path: '/partner-dashboard?tab=push' },
    { id: 'agenda', label: 'Agenda', icon: '📅', path: '/partner-dashboard?tab=agenda' },
    // "Offres Flash" visible uniquement si le partenaire a aussi un abonnement membre payant
    ...(hasMemberSubscription ? [{ id: 'flash', label: 'Offres Flash', icon: '⚡', path: '/flash-offers' }] : []),
  ];

  const tabs = role === 'partner' ? partnerTabs : memberTabs;

  // Déterminer l'onglet actif basé sur l'URL
  const getActiveTab = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    // Si on a un paramètre tab dans l'URL, l'utiliser
    if (tabParam) {
      return tabParam;
    }
    
    // Sinon, chercher par path
    const tab = tabs.find(t => t.path.split('?')[0] === path);
    return tab ? tab.id : 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <nav className="sticky top-14 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 space-x-2 sm:space-x-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              title={tab.label}
              className={`flex items-center space-x-2 px-3 py-4 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-purple-700 border-purple-700 font-semibold'
                  : 'text-gray-600 border-transparent hover:text-purple-600 hover:border-purple-300'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-sm hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
