import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, Filter, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/MapPage.css'; // Pour les styles personnalisés (glassmorphism, clustering)

// --- CONFIGURATION ET COULEURS PEP'S ---
const PEP_COLORS = {
  TURQUOISE: '#2A9D8F',
  CORAL: '#E76F51',
  GREY_DARK: '#264653',
};

// Mock de données de catégories (à remplacer par un appel API réel)
const MOCK_CATEGORIES = [
  'Restaurants', 'Hôtels', 'Beauté & Bien-être', 'Sports & Loisirs',
  'Mode & Accessoires', 'Services', 'Artisanat', 'Automobile',
  'Épiceries fines', 'Santé', 'Autres'
];

// Fonction utilitaire pour générer des couleurs de marqueur basées sur la catégorie
const getCategoryColor = (category) => {
  const hash = category.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const colorIndex = Math.abs(hash) % 5;
  const colors = [PEP_COLORS.TURQUOISE, PEP_COLORS.CORAL, '#F4A261', '#E9C46A', '#264653'];
  return colors[colorIndex];
};

// Icône de marqueur personnalisé (SVG pour un meilleur rendu)
const createCustomIcon = (category) => {
  const color = getCategoryColor(category);
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="background-color: ${color};" class="marker-pin"></div>
      <svg width="30" height="30" viewBox="0 0 100 100" class="marker-shadow">
        <circle cx="50" cy="50" r="30" fill="${color}" opacity="0.8"/>
      </svg>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -35]
  });
};

// Icône de l'utilisateur (bleu pour la géolocalisation)
const userIcon = L.divIcon({
  className: 'user-marker',
  html: `<div class="user-pin"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// --- HOOK ET UTILITAIRES ---

/**
 * Hook personnalisé pour le debounce
 * @param {function} func - La fonction à débouncer
 * @param {number} delay - Le délai en ms
 */
const useDebounce = (func, delay) => {
  const timeoutRef = useRef();

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      func(...args);
    }, delay);
  }, [func, delay]);
};

// --- COMPOSANTS DE LA CARTE ---

/**
 * Gère le zoom et le centrage de la carte
 */
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

/**
 * Barre de recherche et filtres (Glassmorphism)
 */
const SearchBar = ({ onSearch, onGeolocate, partnersCount, onFilterChange, selectedCategory }) => {
  const [query, setQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const debouncedSearch = useDebounce(onSearch, 300);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
      className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-[95%] max-w-2xl p-3 backdrop-blur-md bg-white/50 rounded-xl shadow-2xl border border-white/30 flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-grow">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher partenaire, ville, catégorie..."
            value={query}
            onChange={handleInputChange}
            className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-turq focus:border-turq transition-all"
            aria-label="Champ de recherche"
          />
          {query && (
            <button onClick={() => { setQuery(''); onSearch(''); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-coral transition-colors" aria-label="Effacer la recherche">
              <X size={18} />
            </button>
          )}
        </div>

        <button
          onClick={onGeolocate}
          className="p-3 bg-white text-coral rounded-lg shadow-md hover:bg-coral hover:text-white transition-colors flex items-center justify-center"
          aria-label="Me localiser"
        >
          <MapPin size={20} />
        </button>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`p-3 rounded-lg shadow-md transition-colors flex items-center justify-center ${isFilterOpen ? 'bg-coral text-white' : 'bg-white text-turq hover:bg-turq hover:text-white'}`}
          aria-label="Ouvrir les filtres"
        >
          <Filter size={20} />
        </button>
      </div>

      {isFilterOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-2 pt-0"
        >
          <select
            value={selectedCategory}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-turq focus:border-turq"
            aria-label="Filtrer par catégorie"
          >
            <option value="">Toutes les catégories</option>
            {MOCK_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </motion.div>
      )}

      {/* Compteur de partenaires */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-4 right-4 translate-x-[110%] md:translate-x-full lg:translate-x-[100%] xl:translate-x-[100%] p-2 bg-turq text-white rounded-full text-sm font-bold shadow-lg whitespace-nowrap hidden sm:block"
      >
        <Zap size={16} className="inline mr-1" />
        <CountUp
          end={partnersCount}
          duration={2.5}
          separator=" "
          suffix=" partenaires actifs"
          start={0}
        />
      </motion.div>
    </motion.div>
  );
};

/**
 * Popup enrichie stylisée
 */
const PartnerPopup = ({ partner }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="w-64 font-sans"
  >
    <div className="flex items-center gap-3 border-b pb-2 mb-2 border-gray-200">
      <img
        src={partner.logo_url || 'https://via.placeholder.com/40?text=P'}
        alt={`${partner.name} logo`}
        className="w-10 h-10 rounded-full object-cover shadow-md"
      />
      <div>
        <h3 className="text-lg font-bold text-turq leading-tight">{partner.name}</h3>
        <p className="text-xs text-gray-600 flex items-center">
          <Filter size={10} className="inline mr-1" /> {partner.category}
        </p>
      </div>
    </div>

    <p className="text-sm font-semibold text-coral mb-2 flex items-start">
      <Zap size={14} className="inline mr-1 mt-0.5 flex-shrink-0" />
      {partner.privilege_title}
    </p>

    <p className="text-xs text-gray-500 mb-3">
      📍 {partner.address}, {partner.city}
    </p>

    <Link
      to={`/partner/${partner.id}`}
      className="block w-full text-center py-2 bg-coral text-white rounded-lg text-sm font-medium hover:bg-turq transition-colors"
    >
      Voir le profil →
    </Link>
  </motion.div>
);

// --- COMPOSANT PRINCIPAL ---

export default function MapPage() {
  const [allPartners, setAllPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([46.8, 8.2]); // Centre de la Suisse
  const [mapZoom, setMapZoom] = useState(8);
  const [selectedCategory, setSelectedCategory] = useState('');

  // 1. Chargement initial des partenaires
  useEffect(() => {
    setLoading(true);
    fetch('/api/partners/search_v2?q=')
      .then(response => {
        if (!response.ok) throw new Error('Erreur de chargement des partenaires');
        return response.json();
      })
      .then(data => {
        setAllPartners(data);
        setFilteredPartners(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("API Error:", err);
        setError("Impossible de charger les partenaires. Veuillez réessayer.");
        setLoading(false);
      });
  }, []);

  // 2. Gestion de la recherche et du filtre
  const handleSearchAndFilter = useCallback((query, category) => {
    let results = allPartners;

    // Filtrage par catégorie
    if (category) {
      results = results.filter(p => p.category === category);
    }

    // Filtrage par texte (nom, ville, catégorie)
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.city.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
      );
    }
    setFilteredPartners(results);
  }, [allPartners]);

  // Appliquer le filtre de catégorie
  useEffect(() => {
    handleSearchAndFilter('', selectedCategory);
  }, [selectedCategory, handleSearchAndFilter]);


  // 3. Géolocalisation utilisateur
  const geolocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = [latitude, longitude];
          setUserLocation(newLocation);
          setMapCenter(newLocation);
          setMapZoom(13); // Zoom plus proche
        },
        (err) => {
          console.error("Geolocation Error:", err);
          setError("Géolocalisation refusée ou impossible. Veuillez autoriser l'accès à votre position.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError("Votre navigateur ne supporte pas la géolocalisation.");
    }
  };

  // 4. Gestion de la recherche depuis la barre
  const handleSearchBarSearch = (query) => {
    handleSearchAndFilter(query, selectedCategory);
  };

  // 5. Gestion des erreurs et du chargement
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-turq border-t-transparent rounded-full"
        />
        <p className="ml-4 text-turq font-semibold">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative">
      {/* Bouton de retour */}
      <Link
        to="/"
        className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-full shadow-lg text-turq hover:bg-turq hover:text-white transition-colors hidden sm:flex"
        aria-label="Retour à l'accueil"
      >
        <ArrowLeft />
      </Link>

      {/* Barre de recherche et Compteur */}
      <SearchBar
        onSearch={handleSearchBarSearch}
        onGeolocate={geolocateUser}
        partnersCount={filteredPartners.length}
        onFilterChange={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      {/* Affichage des erreurs */}
      {error && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-24 left-1/2 transform -translate-x-1/2 z-[1000] p-3 bg-coral text-white rounded-lg shadow-xl"
          role="alert"
        >
          {error}
          <button onClick={() => setError(null)} className="ml-4 font-bold">X</button>
        </motion.div>
      )}

      {/* Conteneur de la Carte Leaflet */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        {/* TileLayer CartoDB Voyager pour un look moderne */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Géolocalisation utilisateur */}
        {userLocation && (
          <>
            {/* Marker Utilisateur */}
            <Marker position={userLocation} icon={userIcon}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
            {/* Cercle de 5km */}
            <Circle
              center={userLocation}
              pathOptions={{ color: PEP_COLORS.TURQUOISE, fillColor: PEP_COLORS.TURQUOISE, fillOpacity: 0.1, weight: 2 }}
              radius={5000} // 5 km en mètres
            />
          </>
        )}

        {/* Clustering des Markers */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={40} // Rendre le clustering plus agressif
          spiderfyOnMaxZoom={true}
          // Personnalisation du style du cluster
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            return L.divIcon({
              html: `<div class="cluster-icon" style="background-color: ${PEP_COLORS.CORAL}; border: 3px solid ${PEP_COLORS.TURQUOISE};"><span>${count}</span></div>`,
              className: 'custom-cluster-marker',
              iconSize: L.point(40, 40, true),
            });
          }}
        >
          {filteredPartners.map(p => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={createCustomIcon(p.category)}
              // Animation bounce (implémentée via CSS sur la classe 'custom-marker:hover')
            >
              <Popup>
                <PartnerPopup partner={p} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Affichage mobile du compteur (en bas) */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sm:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] p-2 bg-turq text-white rounded-full text-sm font-bold shadow-lg"
      >
        <Zap size={14} className="inline mr-1" />
        <CountUp
          end={filteredPartners.length}
          duration={2.5}
          suffix=" partenaires"
          start={0}
        />
      </motion.div>
    </div>
  );
}