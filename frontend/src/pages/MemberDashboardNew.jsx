import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SecondaryNav from '../components/SecondaryNav';
import QuickActions from '../components/QuickActions';
import FavoritesSection from '../components/FavoritesSection';
import { useHaptics } from '../hooks/useHaptics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MemberDashboardNew() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemberData();
  }, []);

  const loadMemberData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // Charger le profil membre
      const profileRes = await fetch(`${API_URL}/api/member/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      
      if (profileData.success) {
        const p = profileData.profile;
        setProfile(p);
        
        // Calculer le prochain grade
        let nextGrade = null;
        let progressToNext = 100;
        if (p.grade.name === 'Bronze') {
          nextGrade = 'Argent';
          progressToNext = (p.activations_count / 20) * 100;
        } else if (p.grade.name === 'Argent') {
          nextGrade = 'Or';
          progressToNext = ((p.activations_count - 20) / 30) * 100;
        } else if (p.grade.name === 'Or') {
          nextGrade = 'Diamant';
          progressToNext = ((p.activations_count - 50) / 50) * 100;
        }
        
        setStats({
          grade: p.grade.name,
          gradeIcon: p.grade.emoji,
          points: p.points,
          activations: p.activations_count,
          savings: p.total_savings,
          partnersVisited: p.favorites.length,
          streakWeeks: Math.floor(p.streak / 7),
          nextGrade,
          progressToNext: Math.min(progressToNext, 100),
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement données membre:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
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
      {/* Secondary Navigation */}
      <SecondaryNav role="member" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                👤 Bonjour {profile?.first_name || profile?.name?.split(' ')[0] || 'Membre'} !
              </h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">{stats?.gradeIcon}</span>
                  <div>
                    <p className="text-sm opacity-90">Grade</p>
                    <p className="font-bold">{stats?.grade}</p>
                  </div>
                </div>
                <div className="border-l border-white/30 pl-4">
                  <p className="text-sm opacity-90">PEP's Points</p>
                  <p className="font-bold text-xl">{stats?.points}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>

          {/* Progress Bar */}
          {stats?.nextGrade && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progression vers {stats.nextGrade}</span>
                <span>{stats.progressToNext}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: `${stats.progressToNext}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <QuickActions role="member" />

        {/* Économies Totales */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">💰</span>
            TES ÉCONOMIES
          </h2>
          <div className="text-center py-8">
            <p className="text-5xl font-bold text-green-600 mb-2">
              {stats?.savings} CHF
            </p>
            <p className="text-gray-600">économisés cette année !</p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🎯</span>
              <span className="text-3xl font-bold text-purple-600">{stats?.activations}</span>
            </div>
            <p className="text-gray-600 text-sm">Privilèges activés</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🏪</span>
              <span className="text-3xl font-bold text-purple-600">{stats?.partnersVisited}</span>
            </div>
            <p className="text-gray-600 text-sm">Commerces visités</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🔥</span>
              <span className="text-3xl font-bold text-orange-600">{stats?.streakWeeks}</span>
            </div>
            <p className="text-gray-600 text-sm">Semaines consécutives</p>
          </div>
        </div>

        {/* Défis de la Semaine */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🏆</span>
            DÉFIS DE LA SEMAINE
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Visiter 3 restaurants</p>
                <p className="text-sm text-gray-600">2/3 complétés</p>
              </div>
              <span className="text-green-600 font-bold">+30 points</span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">⏳</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Découvrir un nouveau commerce</p>
                <p className="text-sm text-gray-600">0/1 complété</p>
              </div>
              <span className="text-gray-600 font-bold">+20 points</span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">⏳</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Réserver une offre flash</p>
                <p className="text-sm text-gray-600">0/1 complété</p>
              </div>
              <span className="text-gray-600 font-bold">+25 points</span>
            </div>
          </div>
        </div>

        {/* Mes Favoris */}
        <div className="mb-6">
          <FavoritesSection />
        </div>

        {/* Mes Badges */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎖️</span>
            MES BADGES
          </h2>
          <p className="text-sm text-gray-600 mb-4">12 badges obtenus sur 25 disponibles</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {['👣', '🗺️', '🍽️', '👗', '❤️', '🤝', '🔥', '💰', '🎖️', '🏆', '⭐', '🎯'].map((badge, index) => (
              <div
                key={index}
                className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-3xl hover:scale-110 transition-transform cursor-pointer"
                title={`Badge ${index + 1}`}
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
