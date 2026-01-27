import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PartnerDashboardV21 = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [statistics, setStatistics] = useState(null);
  const [privileges, setPrivileges] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrivilege, setEditingPrivilege] = useState(null);

  // Récupérer le token JWT
  const getToken = () => localStorage.getItem('token');

  // Charger les données
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      if (activeTab === 'stats') {
        const res = await fetch('/api/partner/statistics', { headers });
        const data = await res.json();
        setStatistics(data);
      } else if (activeTab === 'privileges') {
        const res = await fetch('/api/partner/privileges', { headers });
        const data = await res.json();
        setPrivileges(data);
      } else if (activeTab === 'profile') {
        const res = await fetch('/api/partner/profile', { headers });
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
    setLoading(false);
  };

  // Créer/modifier un privilège
  const handleSavePrivilege = async (privilegeData) => {
    try {
      const token = getToken();
      const method = editingPrivilege ? 'PUT' : 'POST';
      const url = editingPrivilege 
        ? `/api/partner/privileges/${editingPrivilege.id}`
        : '/api/partner/privileges';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(privilegeData)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingPrivilege(null);
        loadData();
      }
    } catch (error) {
      console.error('Erreur sauvegarde privilège:', error);
    }
  };

  // Supprimer un privilège
  const handleDeletePrivilege = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce privilège ?')) return;

    try {
      const token = getToken();
      const res = await fetch(`/api/partner/privileges/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Erreur suppression privilège:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00BFA5] to-[#FF6B6B] bg-clip-text text-transparent">
              Dashboard Partner
            </h1>
            <div className="flex gap-2">
              {['stats', 'privileges', 'profile'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-[#00BFA5] to-[#FF6B6B] text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tab === 'stats' && '📊 Statistiques'}
                  {tab === 'privileges' && '🎁 Privilèges'}
                  {tab === 'profile' && '👤 Profil'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#00BFA5] border-t-transparent"></div>
            </motion.div>
          ) : (
            <>
              {/* Onglet Statistiques */}
              {activeTab === 'stats' && statistics && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                      title="Total Activations"
                      value={statistics.total_activations}
                      icon="🎉"
                      color="from-blue-500 to-purple-500"
                    />
                    <StatCard
                      title="7 Derniers Jours"
                      value={statistics.recent_activations}
                      icon="📈"
                      color="from-green-500 to-teal-500"
                    />
                    <StatCard
                      title="Privilèges Actifs"
                      value={statistics.active_offers}
                      icon="✨"
                      color="from-orange-500 to-red-500"
                    />
                  </div>

                  {/* Graphique */}
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Activations des 7 derniers jours</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={statistics.daily_stats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="activations"
                          stroke="#00BFA5"
                          strokeWidth={3}
                          dot={{ fill: '#00BFA5', r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* Onglet Privilèges */}
              {activeTab === 'privileges' && (
                <motion.div
                  key="privileges"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Mes Privilèges</h2>
                    <button
                      onClick={() => {
                        setEditingPrivilege(null);
                        setShowModal(true);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-[#00BFA5] to-[#FF6B6B] text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      ➕ Nouveau Privilège
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {privileges && privileges.length > 0 ? (
                      privileges.map((privilege) => (
                        <PrivilegeCard
                          key={privilege.id}
                          privilege={privilege}
                          onEdit={() => {
                            setEditingPrivilege(privilege);
                            setShowModal(true);
                          }}
                          onDelete={() => handleDeletePrivilege(privilege.id)}
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <div className="text-6xl mb-4">🎁</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          Aucun privilège pour le moment
                        </h3>
                        <p className="text-gray-500 mb-6">
                          Créez votre premier privilège pour commencer à attirer des membres !
                        </p>
                        <button
                          onClick={() => {
                            setEditingPrivilege(null);
                            setShowModal(true);
                          }}
                          className="px-8 py-4 bg-gradient-to-r from-[#00BFA5] to-[#FF6B6B] text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
                        >
                          ➕ Créer mon premier privilège
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Onglet Profil */}
              {activeTab === 'profile' && profile && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-xl p-8"
                >
                  <h2 className="text-2xl font-bold mb-6">Mon Profil</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProfileField label="Nom" value={profile.name} />
                    <ProfileField label="Catégorie" value={profile.category} />
                    <ProfileField label="Adresse" value={profile.address} />
                    <ProfileField label="Ville" value={profile.city} />
                    <ProfileField label="Téléphone" value={profile.phone} />
                    <ProfileField label="Email" value={profile.email} />
                    <ProfileField label="Site Web" value={profile.website} />
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Création/Édition Privilège */}
      {showModal && (
        <PrivilegeModal
          privilege={editingPrivilege}
          onSave={handleSavePrivilege}
          onClose={() => {
            setShowModal(false);
            setEditingPrivilege(null);
          }}
        />
      )}
    </div>
  );
};

// Composant StatCard
const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`bg-gradient-to-br ${color} rounded-2xl shadow-xl p-6 text-white`}
  >
    <div className="text-4xl mb-2">{icon}</div>
    <div className="text-4xl font-bold mb-1">{value}</div>
    <div className="text-white/80">{title}</div>
  </motion.div>
);

// Composant PrivilegeCard
const PrivilegeCard = ({ privilege, onEdit, onDelete }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white rounded-xl shadow-lg overflow-hidden"
  >
    {privilege.image_url && (
      <img src={privilege.image_url} alt={privilege.title} className="w-full h-48 object-cover" />
    )}
    <div className="p-4">
      <h3 className="font-bold text-lg mb-2">{privilege.title}</h3>
      <p className="text-gray-600 text-sm mb-4">{privilege.description}</p>
      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 rounded-full text-sm ${privilege.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {privilege.active ? '✅ Actif' : '⏸️ Inactif'}
        </span>
        <div className="flex gap-2">
          <button onClick={onEdit} className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            ✏️
          </button>
          <button onClick={onDelete} className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600">
            🗑️
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

// Composant ProfileField
const ProfileField = ({ label, value }) => (
  <div>
    <label className="text-sm text-gray-500 font-semibold">{label}</label>
    <div className="text-lg font-medium">{value || 'Non renseigné'}</div>
  </div>
);

// Composant PrivilegeModal
const PrivilegeModal = ({ privilege, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: privilege?.title || '',
    description: privilege?.description || '',
    offer_type: privilege?.offer_type || 'permanent',
    image_url: privilege?.image_url || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">
          {privilege ? 'Modifier le privilège' : 'Nouveau privilège'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Titre</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BFA5] focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BFA5] focus:border-transparent"
              rows="4"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">URL Image</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00BFA5] focus:border-transparent"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00BFA5] to-[#FF6B6B] text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              💾 Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-all"
            >
              ❌ Annuler
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PartnerDashboardV21;
