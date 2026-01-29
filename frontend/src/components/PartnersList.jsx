import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, Gift, Navigation } from 'lucide-react';

/**
 * Liste des partenaires triés par distance
 * avec système de favoris (étoile toggle)
 */
const PartnersList = ({ userLocation }) => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les partenaires à proximité
  useEffect(() => {
    if (userLocation) {
      loadNearbyPartners();
      loadFavorites();
    }
  }, [userLocation]);

  const loadNearbyPartners = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/partners/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=50&limit=20`
      );
      const data = await response.json();

      if (data.success) {
        setPartners(data.partners);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Erreur chargement partenaires:', err);
      setError('Impossible de charger les partenaires');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/member/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        const favIds = new Set(data.favorites.map(f => f.id));
        setFavorites(favIds);
      }
    } catch (err) {
      console.error('Erreur chargement favoris:', err);
    }
  };

  const toggleFavorite = async (partnerId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vous devez être connecté pour ajouter des favoris');
        navigate('/login');
        return;
      }

      const isFavorite = favorites.has(partnerId);
      const method = isFavorite ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/member/favorites/${partnerId}`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Mettre à jour l'état local
        const newFavorites = new Set(favorites);
        if (isFavorite) {
          newFavorites.delete(partnerId);
        } else {
          newFavorites.add(partnerId);
        }
        setFavorites(newFavorites);
      } else {
        alert(data.error || 'Erreur lors de la mise à jour des favoris');
      }
    } catch (err) {
      console.error('Erreur toggle favorite:', err);
      alert('Erreur lors de la mise à jour des favoris');
    }
  };

  const formatDistance = (distanceM) => {
    if (distanceM < 1000) {
      return `${distanceM}m`;
    } else {
      return `${(distanceM / 1000).toFixed(1)}km`;
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2A9D8F] border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des partenaires...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="py-8 text-center">
        <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Aucun partenaire trouvé à proximité</p>
        <p className="text-sm text-gray-500 mt-2">Essayez d'élargir la zone de recherche</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-[#2A9D8F]" />
          <h2 className="text-xl font-bold text-gray-900">
            Partenaires à proximité
          </h2>
        </div>
        <span className="text-sm text-gray-500">
          {partners.length} {partners.length > 1 ? 'résultats' : 'résultat'}
        </span>
      </div>

      {/* Liste des partenaires */}
      <div className="space-y-3 px-4">
        {partners.map((partner, index) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            onClick={() => navigate(`/partner/${partner.id}`)}
          >
            <div className="flex items-center p-4 gap-4">
              {/* Image du partenaire */}
              <div className="flex-shrink-0">
                {partner.image_url ? (
                  <img
                    src={partner.image_url}
                    alt={partner.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#2A9D8F] to-[#E76F51] flex items-center justify-center">
                    <span className="text-2xl text-white font-bold">
                      {partner.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Informations */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">
                      {partner.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {partner.category}
                    </p>
                  </div>

                  {/* Bouton étoile favori */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(partner.id);
                    }}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Star
                      size={24}
                      className={
                        favorites.has(partner.id)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-400'
                      }
                    />
                  </button>
                </div>

                {/* Distance et offres */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm text-[#2A9D8F]">
                    <MapPin size={14} />
                    <span className="font-semibold">
                      {formatDistance(partner.distance_m)}
                    </span>
                  </div>

                  {partner.offers_count > 0 && (
                    <div className="flex items-center gap-1 text-sm text-[#E76F51]">
                      <Gift size={14} />
                      <span className="font-semibold">
                        {partner.offers_count} {partner.offers_count > 1 ? 'privilèges' : 'privilège'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Message info */}
      <div className="mt-6 px-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Astuce :</strong> Ajoutez vos partenaires favoris en cliquant sur l'étoile ⭐ 
            pour recevoir leurs notifications d'offres exclusives !
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnersList;
