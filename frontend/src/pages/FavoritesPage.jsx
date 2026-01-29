import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Phone, Globe, Clock, Navigation, Heart, Sparkles, TrendingUp } from 'lucide-react';
import SecondaryNav from '../components/SecondaryNav';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Couleurs PEP'S
const COLORS = {
  turquoise: '#2A9D8F',
  coral: '#E76F51',
  grey: '#264653',
};

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [sortBy, setSortBy] = useState('distance'); // distance, name, category

  useEffect(() => {
    loadFavorites();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
        }
      );
    }
  };

  const loadFavorites = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getFavoritesWithDistance = () => {
    if (!userLocation) return favorites;
    
    return favorites.map(fav => ({
      ...fav,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        fav.latitude,
        fav.longitude
      )
    }));
  };

  const getSortedFavorites = () => {
    const favoritesWithDistance = getFavoritesWithDistance();
    
    switch (sortBy) {
      case 'distance':
        return favoritesWithDistance.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      case 'name':
        return favoritesWithDistance.sort((a, b) => a.name.localeCompare(b.name));
      case 'category':
        return favoritesWithDistance.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return favoritesWithDistance;
    }
  };

  const handleRemoveFavorite = async (partnerId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/favorites/${partnerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setFavorites(favorites.filter(f => f.id !== partnerId));
      }
    } catch (error) {
      console.error('Erreur suppression favori:', error);
    }
  };

  const handleNavigate = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <SecondaryNav role="member" />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Chargement de vos favoris...</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedFavorites = getSortedFavorites();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <SecondaryNav role="member" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header avec effet Gemini */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Star size={48} className="text-yellow-500 fill-yellow-500" />
            </motion.div>
          </div>
          
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Mes Favoris
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Retrouvez tous vos commerçants préférés en un clin d'œil. 
            <span className="block mt-2 text-sm text-gray-500">
              ⭐ En ajoutant un favori, vous acceptez de recevoir leurs notifications exclusives
            </span>
          </p>

          {/* Stats rapides */}
          <div className="flex justify-center gap-6 mt-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-2xl shadow-lg px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <Heart size={24} className="text-pink-500" />
                <div>
                  <div className="text-3xl font-bold text-gray-800">{favorites.length}</div>
                  <div className="text-sm text-gray-500">Favoris</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-2xl shadow-lg px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={24} className="text-purple-500" />
                <div>
                  <div className="text-3xl font-bold text-gray-800">{favorites.filter(f => f.has_flash_offer).length}</div>
                  <div className="text-sm text-gray-500">Offres Flash</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Filtres de tri */}
        <div className="flex justify-center gap-4 mb-8">
          {[
            { id: 'distance', label: 'Plus proche', icon: MapPin },
            { id: 'name', label: 'Nom A-Z', icon: TrendingUp },
            { id: 'category', label: 'Catégorie', icon: Sparkles },
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSortBy(id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                sortBy === id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:shadow-md'
              }`}
            >
              <Icon size={18} />
              {label}
            </motion.button>
          ))}
        </div>

        {/* Liste des favoris */}
        {sortedFavorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Star size={80} className="text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Aucun favori pour le moment</h2>
            <p className="text-gray-600 mb-8">
              Explorez la carte et ajoutez vos commerçants préférés en cliquant sur l'étoile
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/map')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg"
            >
              Explorer la carte
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {sortedFavorites.map((favorite, index) => (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group"
                  onClick={() => navigate(`/partner/${favorite.id}`)}
                >
                  {/* Image avec badge flash */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={favorite.image_url || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400'}
                      alt={favorite.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Badge Flash Offer */}
                    {favorite.has_flash_offer && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        ⚡ FLASH
                      </div>
                    )}

                    {/* Bouton retirer des favoris */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(favorite.id);
                      }}
                      className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
                    >
                      <Star size={20} className="text-yellow-500 fill-yellow-500" />
                    </motion.button>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>

                  {/* Contenu */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                          {favorite.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">{favorite.category}</p>
                      </div>
                    </div>

                    {/* Distance */}
                    {favorite.distance && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin size={16} className="text-purple-500" />
                        <span className="font-semibold">{favorite.distance.toFixed(1)} km</span>
                      </div>
                    )}

                    {/* Adresse */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {favorite.address}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/partner/${favorite.id}`);
                        }}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold text-sm"
                      >
                        Voir détails
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(favorite.latitude, favorite.longitude);
                        }}
                        className="bg-blue-500 text-white p-2 rounded-lg"
                      >
                        <Navigation size={18} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* CTA bas de page */}
        {sortedFavorites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Découvrez encore plus de partenaires !</h3>
              <p className="mb-6 text-purple-100">
                Explorez la carte interactive et trouvez de nouveaux commerçants près de chez vous
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/map')}
                className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold shadow-lg"
              >
                Explorer la carte
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
