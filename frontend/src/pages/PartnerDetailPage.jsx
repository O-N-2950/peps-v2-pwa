import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Star, 
  Gift, 
  ArrowLeft,
  ExternalLink,
  Share2,
  Store
} from 'lucide-react';
import ConfettiCelebration from '../components/ConfettiCelebration';

/**
 * Page de détail d'un partenaire avec animation confetti
 * lors du déclenchement d'un privilège
 */
const PartnerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [privilegeUsed, setPrivilegeUsed] = useState(false);

  // Charger les données du partenaire
  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const response = await fetch(`/api/partners/${id}`);
        const data = await response.json();
        setPartner(data);
      } catch (error) {
        console.error('Erreur chargement partenaire:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [id]);

  // Fonction pour déclencher le privilège
  const handleUsePrivilege = () => {
    // Déclencher l'animation confetti
    setShowConfetti(true);
    setPrivilegeUsed(true);

    // TODO: Enregistrer le déclenchement dans la base de données
    // fetch('/api/privileges/use', { method: 'POST', body: JSON.stringify({ partnerId: id }) });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A9D8F]/10 to-[#E76F51]/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#2A9D8F] border-t-transparent"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A9D8F]/10 to-[#E76F51]/10 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Partenaire introuvable</h2>
          <button
            onClick={() => navigate('/map')}
            className="px-6 py-3 bg-[#2A9D8F] text-white rounded-lg hover:bg-[#238276] transition"
          >
            Retour à la carte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A9D8F]/10 to-[#E76F51]/10">
      {/* Animation confetti */}
      <ConfettiCelebration 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />

      {/* Header avec image de fond */}
      <div className="relative h-64 bg-gradient-to-r from-[#2A9D8F] to-[#E76F51]">
        {partner.image && (
          <img 
            src={partner.image} 
            alt={partner.name}
            className="w-full h-full object-cover opacity-50"
          />
        )}
        
        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition"
        >
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>

        {/* Bouton partager */}
        <button
          className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition"
        >
          <Share2 className="w-6 h-6 text-gray-800" />
        </button>

        {/* Logo partenaire */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center overflow-hidden border-4 border-white">
            {partner.logo ? (
              <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-12 h-12 text-[#2A9D8F]" />
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-8">
        {/* Nom et catégorie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{partner.name}</h1>
          <p className="text-lg text-gray-600">{partner.category}</p>
          
          {/* Note */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-800">4.8</span>
            <span className="text-gray-600">(127 avis)</span>
          </div>
        </motion.div>

        {/* Privilège exclusif */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-[#2A9D8F] to-[#E76F51] rounded-2xl p-6 mb-6 text-white shadow-xl"
        >
          <div className="flex items-start gap-4">
            <Gift className="w-8 h-8 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Privilège Exclusif PEP'S</h2>
              <p className="text-white/90 text-lg">{partner.privilege || "10% de réduction sur toute la carte"}</p>
            </div>
          </div>

          {/* Bouton pour déclencher le privilège */}
          <button
            onClick={handleUsePrivilege}
            disabled={privilegeUsed}
            className={`
              w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all transform
              ${privilegeUsed 
                ? 'bg-white/30 cursor-not-allowed' 
                : 'bg-white text-[#2A9D8F] hover:scale-105 hover:shadow-2xl active:scale-95'
              }
            `}
          >
            {privilegeUsed ? '✓ Privilège activé !' : 'Activez votre privilège'}
          </button>

          {privilegeUsed && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-white/80 text-sm mt-3"
            >
              Les étoiles prouvent que vous êtes membre actif PEP'S
            </motion.p>
          )}
        </motion.div>

        {/* Informations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Informations</h3>
          
          <div className="space-y-4">
            {/* Adresse */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#2A9D8F] flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-gray-900">Adresse</p>
                <p className="text-gray-600">{partner.address || "Rue de la Gare 15, 2800 Delémont"}</p>
              </div>
            </div>

            {/* Téléphone */}
            {partner.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#2A9D8F] flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Téléphone</p>
                  <a href={`tel:${partner.phone}`} className="text-[#2A9D8F] hover:underline">
                    {partner.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {partner.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#2A9D8F] flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a href={`mailto:${partner.email}`} className="text-[#2A9D8F] hover:underline">
                    {partner.email}
                  </a>
                </div>
              </div>
            )}

            {/* Horaires */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#2A9D8F] flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium text-gray-900">Horaires</p>
                <p className="text-gray-600">Lun-Ven: 9h-18h<br />Sam: 9h-17h<br />Dim: Fermé</p>
              </div>
            </div>

            {/* Site web */}
            {partner.website && (
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-[#2A9D8F] flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Site web</p>
                  <a 
                    href={partner.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#2A9D8F] hover:underline"
                  >
                    Visiter le site
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Description */}
        {partner.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">À propos</h3>
            <p className="text-gray-600 leading-relaxed">{partner.description}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PartnerDetailPage;
