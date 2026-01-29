import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, YAxis } from 'recharts';
import SecondaryNav from '../components/SecondaryNav';
import QuickActions from '../components/QuickActions';
import PartnerBookingDashboard from './PartnerBookingDashboard';
import AICoachWidget from '../components/AICoachWidget';
import PrivilegesManager from '../components/PrivilegesManager';
import CreateFlashOfferModal from '../components/CreateFlashOfferModal';
import SendNotificationModal from '../components/SendNotificationModal';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PartnerDashboardNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  
  const [partner, setPartner] = useState(null);
  const [stats, setStats] = useState(null);
  const [privileges, setPrivileges] = useState([]);
  const [flashOffers, setFlashOffers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [hasMemberSubscription, setHasMemberSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // États pour les modals
  const [showFlashOfferModal, setShowFlashOfferModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    loadPartnerData();
  }, []);

  const loadPartnerData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/partner-login');
      return;
    }

    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Charger les données du partenaire
      const [statsRes, privsRes, flashRes] = await Promise.all([
        fetch(`${API_URL}/api/partner/statistics`, { headers }),
        fetch(`${API_URL}/api/partner/privileges`, { headers }),
        fetch(`${API_URL}/api/partner/flash-offers`, { headers }),
      ]);

      const statsData = await statsRes.json();
      const privsData = await privsRes.json();
      const flashData = await flashRes.json();

      setStats(statsData);
      setPrivileges(privsData);
      setFlashOffers(flashData);

      // Simuler les données du partenaire (à remplacer par un vrai endpoint)
      setPartner({
        name: 'WIN WIN Finance Group',
        location: 'Courgenay',
        category: 'commerce',
      });

      // Vérifier si le partenaire a aussi un abonnement membre payant
      // TODO: Remplacer par un vrai endpoint backend qui vérifie l'abonnement
      setHasMemberSubscription(false); // Par défaut: false

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement données partenaire:', error);
      toast.error('Erreur de chargement');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/partner-login');
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
      <Toaster position="top-center" />
      
      {/* Secondary Navigation */}
      <SecondaryNav role="partner" hasMemberSubscription={hasMemberSubscription} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                🏪 Espace Pro - {partner?.name}
              </h1>
              <p className="text-sm opacity-90">
                {partner?.location} • {partner?.category}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions 
          role="partner" 
          onOpenFlashModal={() => setShowFlashOfferModal(true)}
          onOpenNotificationModal={() => setShowNotificationModal(true)}
        />

        {/* IA Coach Widget */}
        {activeTab === 'dashboard' && (
          <div className="mb-6">
            <AICoachWidget />
          </div>
        )}

        {/* Stats Dashboard */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* KPI Cards - 4 métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Followers */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold opacity-90">FOLLOWERS</p>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-4xl font-bold">{stats.followers_count || 0}</p>
                <p className="text-xs opacity-75 mt-1">Membres qui vous suivent</p>
              </div>

              {/* Total Mois */}
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-lg shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold opacity-90">TOTAL MOIS</p>
                  <span className="text-2xl">📅</span>
                </div>
                <p className="text-4xl font-bold">{stats.total_month || 0}</p>
                <p className="text-xs opacity-75 mt-1">Activations ce mois</p>
              </div>

              {/* Aujourd'hui */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold opacity-90">AUJOURD'HUI</p>
                  <span className="text-2xl">⚡</span>
                </div>
                <p className="text-4xl font-bold">{stats.today || 0}</p>
                <p className="text-xs opacity-75 mt-1">Activations aujourd'hui</p>
              </div>

              {/* Privilèges Actifs */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold opacity-90">PRIVILÈGES</p>
                  <span className="text-2xl">🎁</span>
                </div>
                <p className="text-4xl font-bold">{stats.active_offers || 0}</p>
                <p className="text-xs opacity-75 mt-1">Offres actives</p>
              </div>
            </div>

            {/* Graphique Activité 7 jours */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">📈 Activité 7 derniers jours</h3>
                <span className="text-sm text-gray-500">{stats.recent_activations || 0} activations</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="uses" fill="#0d9488" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Privilèges */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Top Privilèges</h3>
              {stats.top_offers && stats.top_offers.length > 0 ? (
                <div className="space-y-2">
                  {stats.top_offers.map((offer, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b last:border-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                        <span className="text-gray-700 font-medium">{offer.title}</span>
                      </div>
                      <span className="font-bold text-teal-600 text-lg">{offer.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg mb-2">📊 Aucune donnée disponible</p>
                  <p className="text-gray-400 text-sm">Créez vos premiers privilèges pour voir les statistiques</p>
                </div>
              )}
            </div>

            {/* Widget Followers détaillé */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-sm border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">👥 Vos Followers</h3>
                <span className="bg-purple-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                  {stats.followers_count || 0}
                </span>
              </div>
              <p className="text-gray-700 mb-4">
                {stats.followers_count > 0 
                  ? `${stats.followers_count} membre${stats.followers_count > 1 ? 's' : ''} vous suit${stats.followers_count > 1 ? 'ent' : ''} et recevra${stats.followers_count > 1 ? 'ont' : ''} vos notifications push.`
                  : "Aucun follower pour l'instant. Créez des offres attractives pour gagner des followers !"}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">7 derniers jours</p>
                  <p className="text-2xl font-bold text-purple-600">+0</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">30 derniers jours</p>
                  <p className="text-2xl font-bold text-purple-600">+0</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Privilèges */}
        {activeTab === 'privileges' && (
          <PrivilegesManager />
        )}

        {/* Onglet Push */}
        {activeTab === 'push' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Offres Flash</h2>
            {/* Contenu des offres flash */}
            <p className="text-gray-600">Gérer vos offres flash...</p>
          </div>
        )}

        {/* Onglet Agenda */}
        {activeTab === 'agenda' && (
          <div>
            <PartnerBookingDashboard partnerId={partner?.id || 2} />
          </div>
        )}
      </div>
      
      {/* Modals */}
      <CreateFlashOfferModal 
        isOpen={showFlashOfferModal}
        onClose={() => setShowFlashOfferModal(false)}
        onSuccess={() => {
          loadPartnerData();
          toast.success('✨ Offre flash créée et envoyée à vos followers !');
        }}
      />
      
      <SendNotificationModal 
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onSuccess={() => {
          toast.success('📣 Notification envoyée avec succès !');
        }}
      />
    </div>
  );
}
