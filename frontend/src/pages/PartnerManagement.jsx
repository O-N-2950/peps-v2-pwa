import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function PartnerManagement() {
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 Fetching partners...');
    setLoading(true);
    
    axios.get('/api/partners/search_v2?q=')
      .then(res => {
        console.log('✅ API Response:', res.data);
        const partnersList = Array.isArray(res.data) ? res.data : res.data.partners || [];
        console.log('📦 Partners loaded:', partnersList.length);
        setPartners(partnersList);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredPartners = partners.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase())
  );

  console.log('🎨 Rendering:', { loading, error, partnersCount: partners.length });

  // État de chargement visible
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-700">Chargement des partenaires...</p>
        </div>
      </div>
    );
  }

  // État d'erreur visible
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec contraste fort */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion Partenaires
              </h1>
              <p className="text-gray-600 mt-2">
                {partners.length} partenaires • {filteredPartners.length} affichés
              </p>
            </div>
            <input
              type="text"
              placeholder="🔍 Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-64"
            />
          </div>

          {/* Message si aucun résultat */}
          {filteredPartners.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-xl text-gray-500">
                {partners.length === 0 
                  ? '📭 Aucun partenaire trouvé' 
                  : '🔍 Aucun résultat pour votre recherche'}
              </p>
            </div>
          )}

          {/* Tableau avec meilleur contraste */}
          {filteredPartners.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Ville
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPartners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {partner.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {partner.category || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {partner.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          partner.is_active 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {partner.is_active ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-3">
                        <button className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                          ✏️ Éditer
                        </button>
                        <button className="text-red-600 hover:text-red-800 font-medium hover:underline">
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
