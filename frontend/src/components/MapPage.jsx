import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Search, MapPin, Filter, X, Navigation, Phone, Mail, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon for partners
const partnerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom marker icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// MarkerCluster component
function MarkerClusterGroup({ partners, onMarkerClick }) {
  const map = useMap();

  useEffect(() => {
    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 80,
    });

    partners.forEach(partner => {
      if (partner.latitude && partner.longitude) {
        const marker = L.marker([partner.latitude, partner.longitude], { icon: partnerIcon });
        
        const popupContent = `
          <div class="p-2 min-w-[250px]">
            <h3 class="font-bold text-lg mb-2 text-purple-600">${partner.company_name || partner.name}</h3>
            ${partner.activity_sector ? `<p class="text-sm text-gray-600 mb-2">📍 ${partner.activity_sector}</p>` : ''}
            ${partner.address ? `<p class="text-xs text-gray-500 mb-1">${partner.address}</p>` : ''}
            ${partner.phone ? `<p class="text-xs text-gray-500 mb-1">📞 ${partner.phone}</p>` : ''}
            ${partner.email ? `<p class="text-xs text-gray-500 mb-2">✉️ ${partner.email}</p>` : ''}
            ${partner.privileges && partner.privileges.length > 0 ? `
              <div class="mt-2 p-2 bg-purple-50 rounded">
                <p class="text-xs font-semibold text-purple-700 mb-1">🎁 Privilèges exclusifs :</p>
                <ul class="text-xs text-gray-700 list-disc list-inside">
                  ${partner.privileges.slice(0, 3).map(p => `<li>${p.description || p.title}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            <button 
              onclick="window.dispatchEvent(new CustomEvent('partner-select', { detail: ${partner.id} }))"
              class="mt-2 w-full bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
            >
              Voir les détails
            </button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.on('click', () => onMarkerClick(partner));
        markers.addLayer(marker);
      }
    });

    map.addLayer(markers);

    return () => {
      map.removeLayer(markers);
    };
  }, [partners, map, onMarkerClick]);

  return null;
}

// User location marker component
function UserLocationMarker({ userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<div class="text-center"><strong>Vous êtes ici</strong></div>');
      
      map.setView([userLocation.lat, userLocation.lng], 13);

      return () => {
        map.removeLayer(marker);
      };
    }
  }, [userLocation, map]);

  return null;
}

export default function MapPage() {
  const [partners, setPartners] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // Fetch partners and sectors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partnersRes, sectorsRes] = await Promise.all([
          fetch('/api/partners/search_v2'),
          fetch('/api/activity_sectors')
        ]);

        if (partnersRes.ok) {
          const data = await partnersRes.json();
          setPartners(data.partners || []);
        }

        if (sectorsRes.ok) {
          const data = await sectorsRes.json();
          setSectors(data.sectors || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Listen for partner selection from popup
  useEffect(() => {
    const handlePartnerSelect = (event) => {
      const partnerId = event.detail;
      const partner = partners.find(p => p.id === partnerId);
      if (partner) {
        setSelectedPartner(partner);
        setShowSidebar(true);
      }
    };

    window.addEventListener('partner-select', handlePartnerSelect);
    return () => window.removeEventListener('partner-select', handlePartnerSelect);
  }, [partners]);

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
    }
  };

  // Filter partners
  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
      const matchesSearch = !searchTerm || 
        (partner.company_name || partner.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (partner.activity_sector || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (partner.address || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSector = !selectedSector || partner.activity_sector === selectedSector;

      return matchesSearch && matchesSector && partner.latitude && partner.longitude;
    });
  }, [partners, searchTerm, selectedSector]);

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (filteredPartners.length > 0) {
      const avgLat = filteredPartners.reduce((sum, p) => sum + p.latitude, 0) / filteredPartners.length;
      const avgLng = filteredPartners.reduce((sum, p) => sum + p.longitude, 0) / filteredPartners.length;
      return [avgLat, avgLng];
    }
    return [46.5197, 6.6323]; // Lausanne, Switzerland
  }, [filteredPartners, userLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  Carte des Partenaires
                </h1>
                <p className="text-sm text-gray-600">
                  {filteredPartners.length} partenaire{filteredPartners.length > 1 ? 's' : ''} trouvé{filteredPartners.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un partenaire, secteur, ville..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Filter className="w-5 h-5" />
                Filtres
              </button>
              <button
                onClick={getUserLocation}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Navigation className="w-5 h-5" />
                Ma position
              </button>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {showSidebar ? 'Masquer' : 'Afficher'} la liste
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrer par secteur d'activité
                  </label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Tous les secteurs ({partners.length})</option>
                    {sectors.map(sector => (
                      <option key={sector.id} value={sector.name}>
                        {sector.name} ({partners.filter(p => p.activity_sector === sector.name).length})
                      </option>
                    ))}
                  </select>
                  {selectedSector && (
                    <button
                      onClick={() => setSelectedSector('')}
                      className="mt-2 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Réinitialiser le filtre
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Map Container */}
      <div className="absolute inset-0 pt-32">
        <MapContainer
          center={mapCenter}
          zoom={userLocation ? 13 : 10}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MarkerClusterGroup 
            partners={filteredPartners} 
            onMarkerClick={(partner) => {
              setSelectedPartner(partner);
              setShowSidebar(true);
            }}
          />
          {userLocation && <UserLocationMarker userLocation={userLocation} />}
        </MapContainer>
      </div>

      {/* Sidebar with Partners List */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="absolute right-0 top-32 bottom-0 w-96 bg-white shadow-2xl z-[1000] overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Liste des Partenaires</h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-sm text-white/90 mt-1">
                  {filteredPartners.length} résultat{filteredPartners.length > 1 ? 's' : ''}
                </p>
              </div>

              {/* Partners List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredPartners.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucun partenaire trouvé</p>
                  </div>
                ) : (
                  filteredPartners.map(partner => (
                    <motion.div
                      key={partner.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedPartner(partner)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPartner?.id === partner.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 bg-white'
                      }`}
                    >
                      <h3 className="font-bold text-gray-800 mb-1">
                        {partner.company_name || partner.name}
                      </h3>
                      {partner.activity_sector && (
                        <p className="text-sm text-purple-600 mb-2">
                          📍 {partner.activity_sector}
                        </p>
                      )}
                      {partner.address && (
                        <p className="text-xs text-gray-600 mb-1">
                          {partner.address}
                        </p>
                      )}
                      {partner.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <Phone className="w-3 h-3" />
                          {partner.phone}
                        </div>
                      )}
                      {partner.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Mail className="w-3 h-3" />
                          {partner.email}
                        </div>
                      )}
                      {partner.privileges && partner.privileges.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-semibold text-purple-700 mb-1">
                            🎁 {partner.privileges.length} privilège{partner.privileges.length > 1 ? 's' : ''} exclusif{partner.privileges.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              {/* Selected Partner Details */}
              {selectedPartner && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    {selectedPartner.company_name || selectedPartner.name}
                  </h3>
                  {selectedPartner.privileges && selectedPartner.privileges.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-purple-700">Privilèges exclusifs :</p>
                      {selectedPartner.privileges.map((priv, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border border-purple-200">
                          <p className="text-sm text-gray-700">{priv.description || priv.title}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedPartner.website && (
                    <a
                      href={selectedPartner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visiter le site web
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
