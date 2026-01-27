import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Phone, Mail, Clock, Calendar, ArrowLeft, 
  Star, Sparkles, CheckCircle, Info, ExternalLink 
} from 'lucide-react';
import BookingCalendar from '../components/BookingCalendar';

const PartnerDetailPage = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStars, setShowStars] = useState(false);
  const [privilegeActivated, setPrivilegeActivated] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    fetchPartnerDetails();
  }, [partnerId]);

  const fetchPartnerDetails = async () => {
    try {
      const response = await fetch(`https://www.peps.swiss/api/partners`);
      if (response.ok) {
        const partners = await response.json();
        const foundPartner = partners.find(p => p.id === parseInt(partnerId));
        setPartner(foundPartner);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du partenaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const activatePrivilege = () => {
    setShowStars(true);
    setPrivilegeActivated(true);
    
    // Animation d'étoiles pendant 3 secondes
    setTimeout(() => {
      setShowStars(false);
    }, 3000);

    // Enregistrer l'utilisation du privilège
    logPrivilegeUsage();
  };

  const logPrivilegeUsage = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('https://www.peps.swiss/api/privileges/use', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partner_id: partnerId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
    }
  };

  const formatSchedule = (schedule) => {
    if (!schedule) return 'Horaires non disponibles';
    
    const days = {
      monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche'
    };

    return Object.entries(schedule).map(([day, hours]) => (
      <div key={day} className="flex justify-between py-1">
        <span className="font-medium">{days[day]}</span>
        <span className="text-gray-600">
          {hours.open && hours.close ? `${hours.open} - ${hours.close}` : 'Fermé'}
        </span>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Partenaire non trouvé</h2>
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à la carte
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec image de fond */}
      <div className="relative h-64 bg-gradient-to-br from-emerald-500 to-teal-600">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        
        {partner.logo_url && (
          <img 
            src={partner.logo_url} 
            alt={partner.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <h1 className="text-3xl font-bold text-white mb-2">{partner.name}</h1>
          <p className="text-white/90 text-lg">{partner.category || 'Commerce'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Bouton d'activation du privilège */}
        <div className="bg-white rounded-lg shadow-lg p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Sparkles className="w-6 h-6 text-yellow-500 mr-2" />
              <h2 className="text-xl font-bold">Privilège PEP'S</h2>
            </div>
            {privilegeActivated && (
              <CheckCircle className="w-6 h-6 text-green-500" />
            )}
          </div>

          {partner.offers && partner.offers.length > 0 ? (
            <div className="space-y-3 mb-4">
              {partner.offers.map((offer, index) => (
                <div key={index} className="bg-emerald-50 rounded-lg p-4">
                  <h3 className="font-semibold text-emerald-900">{offer.title}</h3>
                  {offer.description && (
                    <p className="text-sm text-emerald-700 mt-1">{offer.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 mb-4">Privilège exclusif pour les membres PEP'S</p>
          )}

          <button
            onClick={activatePrivilege}
            disabled={privilegeActivated}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
              privilegeActivated
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105'
            }`}
          >
            {privilegeActivated ? '✓ Privilège activé' : '✨ Activer votre privilège'}
          </button>

          {/* Animation d'étoiles */}
          {showStars && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-star"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    fontSize: `${Math.random() * 20 + 10}px`
                  }}
                >
                  {['⭐', '✨', '💫', '🌟'][Math.floor(Math.random() * 4)]}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informations de contact */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-bold mb-4">Informations</h2>
          
          {partner.address && (
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Adresse</p>
                <p className="text-gray-600">{partner.address}</p>
                {partner.city && <p className="text-gray-600">{partner.postal_code} {partner.city}</p>}
              </div>
            </div>
          )}

          {partner.phone && (
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Téléphone</p>
                <a href={`tel:${partner.phone}`} className="text-emerald-600 hover:underline">
                  {partner.phone}
                </a>
              </div>
            </div>
          )}

          {partner.email && (
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Email</p>
                <a href={`mailto:${partner.email}`} className="text-emerald-600 hover:underline">
                  {partner.email}
                </a>
              </div>
            </div>
          )}

          {partner.website && (
            <div className="flex items-center">
              <ExternalLink className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Site web</p>
                <a 
                  href={partner.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  Visiter le site
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Horaires d'ouverture */}
        {partner.schedule && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-emerald-600 mr-2" />
              <h2 className="text-xl font-bold">Horaires d'ouverture</h2>
            </div>
            <div className="space-y-1">
              {formatSchedule(partner.schedule)}
            </div>
          </div>
        )}

        {/* Section réservation (si le partenaire a un système de réservation) */}
        {partner.booking_enabled && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-emerald-600 mr-2" />
                <h2 className="text-xl font-bold">Prendre rendez-vous</h2>
              </div>
            </div>
            
            {!showBooking ? (
              <button
                onClick={() => setShowBooking(true)}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Voir les disponibilités
              </button>
            ) : (
              <div className="pt-4">
                <BookingCalendar partnerId={partnerId} partnerName={partner.name} />
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {partner.description && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Info className="w-5 h-5 text-emerald-600 mr-2" />
              <h2 className="text-xl font-bold">À propos</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{partner.description}</p>
          </div>
        )}
      </div>

      {/* CSS pour l'animation des étoiles */}
      <style>{`
        @keyframes star {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-50px) scale(1.5) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0) rotate(360deg);
          }
        }
        .animate-star {
          animation: star 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PartnerDetailPage;
