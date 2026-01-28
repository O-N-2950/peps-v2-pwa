import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import SecondaryNav from '../components/SecondaryNav';
import QuickActions from '../components/QuickActions';
import PartnerBookingDashboard from './PartnerBookingDashboard';
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
  const [loading, setLoading] = useState(true);

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
      <SecondaryNav role="partner" />

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
        <QuickActions role="partner" />

        {/* Stats Dashboard */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Statistiques Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-teal-600">
                <p className="text-gray-500 text-sm font-semibold mb-1">TOTAL MOIS</p>
                <p className="text-4xl font-bold text-gray-900">{stats.total_month || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
                <p className="text-gray-500 text-sm font-semibold mb-1">AUJOURD'HUI</p>
                <p className="text-4xl font-bold text-gray-900">{stats.today || 0}</p>
              </div>
            </div>

            {/* Graphique Activité 7 jours */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Activité 7 jours</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chart || []}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="uses" fill="#0d9488" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Privilèges */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Privilèges</h3>
              {stats.top_offers && stats.top_offers.length > 0 ? (
                <div className="space-y-2">
                  {stats.top_offers.map((offer, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b last:border-0">
                      <span className="text-gray-700">{offer.title}</span>
                      <span className="font-bold text-teal-600">{offer.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">Aucune donnée disponible</p>
              )}
            </div>
          </div>
        )}

        {/* Onglet Privilèges */}
        {activeTab === 'privileges' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mes Privilèges</h2>
            {/* Contenu des privilèges */}
            <p className="text-gray-600">Liste des privilèges permanents...</p>
          </div>
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
    </div>
  );
}
