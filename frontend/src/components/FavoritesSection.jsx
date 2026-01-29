import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Gift, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Section "Mes Favoris" pour le dashboard membre
 * Affiche la liste des partenaires favoris avec possibilité de les retirer
 */
const FavoritesSection = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/member/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setFavorites(data.favorites);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Erreur chargement favoris:', err);
      setError('Impossible de charger vos favoris');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (partnerId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/member/favorites/${partnerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Retirer de la liste locale
        setFavorites(favorites.filter(f => f.id !== partnerId));
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression favori:', err);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2A9D8F] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <h2 className="text-2xl font-bold text-gray-900">
            Mes Partenaires Favoris
          </h2>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {favorites.length} {favorites.length > 1 ? 'favoris' : 'favori'}
        </span>
      </div>

      {/* Message info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          🔔 <strong>Notifications activées</strong> : Vous recevrez des notifications pour les offres exclusives 
          et événements de vos partenaires favoris !
        </p>
      </div>

      {/* Liste des favoris */}
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Aucun partenaire favori pour le moment</p>
          <p className="text-sm text-gray-500 mb-4">
            Ajoutez des partenaires à vos favoris pour recevoir leurs notifications
          </p>
          <button
            onClick={() => navigate('/map')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2A9D8F] to-[#E76F51] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <MapPin size={20} />
            Explorer la carte
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-[#2A9D8F] hover:shadow-lg transition-all overflow-hidden group"
            >
              {/* En-tête de la carte */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-[#2A9D8F] transition-colors">
                      {partner.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {partner.category}
                    </p>
                  </div>
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                </div>

                {/* Informations */}
                <div className="space-y-2 mb-4">
                  {partner.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="flex-shrink-0 mt-0.5 text-[#2A9D8F]" />
                      <span className="line-clamp-2">{partner.address}</span>
                    </div>
                  )}
                  
                  {partner.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>📞</span>
                      <a 
                        href={`tel:${partner.phone}`}
                        className="hover:text-[#2A9D8F] transition-colors"
                      >
                        {partner.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Date d'ajout */}
                <p className="text-xs text-gray-400 mb-4">
                  ⭐ Ajouté le {new Date(partner.favorited_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/partner/${partner.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2A9D8F] text-white rounded-lg text-sm font-semibold hover:bg-[#238276] transition-colors"
                  >
                    <ExternalLink size={16} />
                    Voir le profil
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Retirer ${partner.name} de vos favoris ?`)) {
                        removeFavorite(partner.id);
                      }
                    }}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title="Retirer des favoris"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bouton pour ajouter plus de favoris */}
      {favorites.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/map')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            <Star size={20} />
            Ajouter d'autres favoris
          </button>
        </div>
      )}
    </div>
  );
};

export default FavoritesSection;
