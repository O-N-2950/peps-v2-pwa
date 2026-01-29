import React, { useState, useEffect } from 'react';
import { FiUsers, FiAlertTriangle, FiMapPin, FiPlus, FiSearch, FiTrash2, FiEdit } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/useToast';

const COLORS = {
  primary: '#38B2AC',
  accent: '#F26D7D',
};

export default function PartnerManagementAdmin() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  // Charger les partenaires depuis l'API réelle
  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partners/search_v2?q=');
      if (!response.ok) throw new Error('Erreur API');
      const data = await response.json();
      setPartners(data);
      showToast(`${data.length} partenaires chargés`, 'success');
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur de chargement des partenaires', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deletePartner = async (id) => {
    if (!window.confirm('Supprimer ce partenaire ?')) return;
    try {
      const response = await fetch(`/api/partners/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur suppression');
      setPartners(partners.filter(p => p.id !== id));
      showToast('Partenaire supprimé', 'success');
    } catch (error) {
      showToast('Erreur de suppression', 'error');
    }
  };

  const filteredPartners = partners.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Détecter les doublons
  const duplicates = partners.reduce((acc, partner) => {
    const existing = acc.find(p => p.name === partner.name);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ name: partner.name, count: 1 });
    }
    return acc;
  }, []).filter(p => p.count > 1);

  const missingCities = partners.filter(p => !p.city || p.city === 'Ville inconnue').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Gestion Partenaires</h1>
          <p className="text-gray-400">Dashboard Admin PEP'S</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{partners.length}</div>
                <div className="text-sm opacity-80">Total Partenaires</div>
              </div>
              <FiUsers className="w-10 h-10 opacity-70" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{duplicates.length}</div>
                <div className="text-sm opacity-80">Doublons Détectés</div>
              </div>
              <FiAlertTriangle className="w-10 h-10 opacity-70" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{missingCities}</div>
                <div className="text-sm opacity-80">Villes Manquantes</div>
              </div>
              <FiMapPin className="w-10 h-10 opacity-70" />
            </div>
          </motion.div>
        </div>

        {/* Recherche */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un partenaire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Liste des partenaires */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left">Nom</th>
                <th className="px-6 py-4 text-left">Catégorie</th>
                <th className="px-6 py-4 text-left">Ville</th>
                <th className="px-6 py-4 text-left">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner, index) => (
                <tr key={partner.id || index} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="px-6 py-4 font-medium">{partner.name}</td>
                  <td className="px-6 py-4 text-gray-400">{partner.category || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-400">{partner.city || 'Ville inconnue'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      partner.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {partner.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => window.location.href = `/admin/partners/${partner.id}/edit`}
                      className="mr-2 p-2 text-teal-400 hover:bg-teal-500/20 rounded"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => deletePartner(partner.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPartners.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Aucun partenaire trouvé
          </div>
        )}
      </div>
    </div>
  );
}
