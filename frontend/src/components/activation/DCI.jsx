import { useState, useEffect } from 'react';
import { MapPin, Wifi, Smartphone, Clock, CheckCircle, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * DCI - Détection Contextuelle Intelligente
 * 
 * Composant qui détecte automatiquement si le membre est proche d'un partenaire
 * et affiche une notification pour activer le privilège.
 * 
 * Critères de détection :
 * - Géolocalisation (rayon 100m du partenaire)
 * - Heure d'ouverture du partenaire
 * - Abonnement actif
 * - Pas d'activation récente (< 24h)
 */
export default function DCI({ partnerId, onActivate }) {
  const [detection, setDetection] = useState({
    loading: true,
    canActivate: false,
    distance: null,
    isOpen: false,
    hasSubscription: false,
    lastActivation: null,
    reasons: []
  });

  const [userLocation, setUserLocation] = useState(null);
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    detectContext();
    
    // Rafraîchir la détection toutes les 30 secondes
    const interval = setInterval(detectContext, 30000);
    return () => clearInterval(interval);
  }, [partnerId]);

  const detectContext = async () => {
    try {
      // 1. Obtenir la géolocalisation de l'utilisateur
      const location = await getUserLocation();
      setUserLocation(location);

      // 2. Récupérer les informations du partenaire
      const partnerData = await fetchPartnerData(partnerId);
      setPartner(partnerData);

      // 3. Vérifier l'abonnement
      const subscription = await checkSubscription();

      // 4. Calculer la distance
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        partnerData.latitude,
        partnerData.longitude
      );

      // 5. Vérifier les horaires d'ouverture
      const isOpen = checkOpeningHours(partnerData.opening_hours);

      // 6. Vérifier la dernière activation
      const lastActivation = await checkLastActivation(partnerId);

      // 7. Déterminer si l'activation est possible
      const reasons = [];
      let canActivate = true;

      if (!subscription.active) {
        canActivate = false;
        reasons.push('Abonnement inactif');
      }

      if (distance > 100) {
        canActivate = false;
        reasons.push(`Trop loin (${Math.round(distance)}m)`);
      }

      if (!isOpen) {
        canActivate = false;
        reasons.push('Établissement fermé');
      }

      if (lastActivation && lastActivation.hoursAgo < 24) {
        canActivate = false;
        reasons.push(`Activation récente (il y a ${Math.round(lastActivation.hoursAgo)}h)`);
      }

      setDetection({
        loading: false,
        canActivate,
        distance,
        isOpen,
        hasSubscription: subscription.active,
        lastActivation,
        reasons
      });

    } catch (error) {
      console.error('Erreur détection contextuelle:', error);
      setDetection({
        loading: false,
        canActivate: false,
        distance: null,
        isOpen: false,
        hasSubscription: false,
        lastActivation: null,
        reasons: ['Erreur de détection']
      });
    }
  };

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  };

  const fetchPartnerData = async (id) => {
    const response = await fetch(`${API_URL}/api/partners/${id}`);
    const data = await response.json();
    return data.partner;
  };

  const checkSubscription = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/member/check-subscription`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  };

  const checkLastActivation = async (partnerId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/member/activations?partner_id=${partnerId}&limit=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.activations && data.activations.length > 0) {
      const last = data.activations[0];
      const hoursAgo = (Date.now() - new Date(last.activated_at).getTime()) / (1000 * 60 * 60);
      return { ...last, hoursAgo };
    }
    
    return null;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Formule de Haversine pour calculer la distance entre deux points GPS
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
  };

  const checkOpeningHours = (openingHours) => {
    if (!openingHours) return true; // Si pas d'horaires, considérer comme ouvert

    const now = new Date();
    const day = now.getDay(); // 0 = Dimanche, 1 = Lundi, ...
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute;

    // Exemple de structure opening_hours: { "1": "09:00-18:00", "2": "09:00-18:00", ... }
    const todayHours = openingHours[day.toString()];
    if (!todayHours || todayHours === 'closed') return false;

    const [open, close] = todayHours.split('-');
    const [openHour, openMinute] = open.split(':').map(Number);
    const [closeHour, closeMinute] = close.split(':').map(Number);

    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;

    return currentTime >= openTime && currentTime <= closeTime;
  };

  const handleActivate = async () => {
    if (!detection.canActivate) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/member/activate-privilege`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offer_id: partner.default_offer_id, // À adapter selon votre structure
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          device_info: navigator.userAgent
        })
      });

      const data = await response.json();

      if (data.success) {
        onActivate(data.activation);
      }
    } catch (error) {
      console.error('Erreur activation:', error);
    }
  };

  if (detection.loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="text-gray-600">Détection contextuelle en cours...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-lg p-6 mb-6 ${
      detection.canActivate ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-white'
    }`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Wifi className={`w-6 h-6 ${detection.canActivate ? 'text-white' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-bold ${detection.canActivate ? 'text-white' : 'text-gray-800'}`}>
            Détection Contextuelle
          </h3>
        </div>
        {detection.canActivate ? (
          <CheckCircle className="w-8 h-8 text-white" />
        ) : (
          <XCircle className="w-8 h-8 text-red-500" />
        )}
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`flex items-center space-x-2 ${detection.canActivate ? 'text-white' : 'text-gray-600'}`}>
          <MapPin className="w-5 h-5" />
          <span className="text-sm">
            {detection.distance !== null ? `${Math.round(detection.distance)}m` : 'N/A'}
          </span>
        </div>

        <div className={`flex items-center space-x-2 ${detection.canActivate ? 'text-white' : 'text-gray-600'}`}>
          <Clock className="w-5 h-5" />
          <span className="text-sm">
            {detection.isOpen ? 'Ouvert' : 'Fermé'}
          </span>
        </div>

        <div className={`flex items-center space-x-2 ${detection.canActivate ? 'text-white' : 'text-gray-600'}`}>
          <Smartphone className="w-5 h-5" />
          <span className="text-sm">
            {detection.hasSubscription ? 'Actif' : 'Inactif'}
          </span>
        </div>

        <div className={`flex items-center space-x-2 ${detection.canActivate ? 'text-white' : 'text-gray-600'}`}>
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">
            {detection.lastActivation ? `Il y a ${Math.round(detection.lastActivation.hoursAgo)}h` : 'Jamais'}
          </span>
        </div>
      </div>

      {/* Raisons */}
      {!detection.canActivate && detection.reasons.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800 font-semibold mb-2">Activation impossible :</p>
          <ul className="text-sm text-red-700 space-y-1">
            {detection.reasons.map((reason, index) => (
              <li key={index}>• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Bouton d'activation */}
      {detection.canActivate && (
        <button
          onClick={handleActivate}
          className="w-full bg-white text-green-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
        >
          <CheckCircle className="w-5 h-5" />
          <span>Activer le privilège</span>
        </button>
      )}
    </div>
  );
}
