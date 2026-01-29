import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiUsers, FiAlertTriangle, FiMapPin, FiPlus, FiSearch, FiTrash2, FiEdit, FiUploadCloud, FiDownload, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './hooks/useToast'; // Simuler un hook de toast
import { useUndoRedo } from './hooks/useUndoRedo'; // Simuler un hook d'Undo/Redo

// --- SIMULATION DES DONNÉES ET DE L'API ---
const initialPartners = [
  { id: 'p1', name: 'Le Café des Artistes', city: 'Paris', contact: 'alice@art.fr', status: 'Active', score: 95, logo: '/logos/cafe.png' },
  { id: 'p2', name: 'L\'Atelier Gourmand', city: 'Lyon', contact: 'bob@gourmand.fr', status: 'Active', score: 88, logo: '/logos/atelier.png' },
  { id: 'p3', name: 'Le Café des Artistes', city: 'Paris', contact: 'alice.dup@art.fr', status: 'Duplicate', score: 90, logo: '/logos/cafe.png' }, // Doublon
  { id: 'p4', name: 'Boutique Éphémère', city: '', contact: 'eve@boutique.fr', status: 'Needs Data', score: 70, logo: null }, // Données manquantes
  { id: 'p5', name: 'Tech Solutions', city: 'Marseille', contact: 'marc@tech.fr', status: 'Active', score: 92, logo: '/logos/tech.png' },
];

const simulateApiCall = (data, delay = 500) => new Promise(resolve => setTimeout(() => resolve(data), delay));

// --- COULEURS ET STYLES UTILITAIRES ---
const COLORS = {
  primary: '#38B2AC', // Turquoise
  accent: '#F26D7D', // Corail
  bgGlass: 'rgba(255, 255, 255, 0.15)',
  borderGlass: 'rgba(255, 255, 255, 0.3)',
};

// --- COMPOSANTS UX CLÉS (Simulés pour la structure) ---

// 1. Loading Spinner stylisé
const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex items-center justify-center p-4"
  >
    <div className="w-6 h-6 border-4 border-t-4 rounded-full animate-spin" style={{ borderColor: COLORS.primary, borderTopColor: COLORS.accent }}></div>
    <span className="ml-3 text-sm text-gray-300">Chargement des données PEP'S...</span>
  </motion.div>
);

// 2. Modale générique avec Glassmorphism
const Modal = ({ isOpen, onClose, title, children, size = 'lg' }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.9 }}
          className={`relative p-6 rounded-xl shadow-2xl backdrop-blur-xl ${size === 'lg' ? 'w-full max-w-2xl' : 'w-full max-w-4xl'}`}
          style={{ background: COLORS.bgGlass, border: `1px solid ${COLORS.borderGlass}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold text-white mb-4 border-b pb-2" style={{ borderColor: COLORS.borderGlass }}>
            {title}
          </h2>
          {children}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-300 hover:text-white transition"
          >
            &times;
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// 3. Carte d'aperçu (Glassmorphism)
const StatCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
    className="p-5 rounded-xl backdrop-blur-lg shadow-lg text-white"
    style={{ background: COLORS.bgGlass, border: `1px solid ${COLORS.borderGlass}` }}
  >
    <div className="flex items-center justify-between">
      <div className="text-3xl font-extrabold">{value}</div>
      <Icon className="w-8 h-8 opacity-70" style={{ color }} />
    </div>
    <p className="mt-2 text-sm opacity-80">{title}</p>
  </motion.div>
);

// 4. Composant de recherche avec Framer Motion
const SearchBar = ({ searchTerm, setSearchTerm, filters, setFilters }) => (
  <div className="flex space-x-4">
    <div className="relative flex-grow">
      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher par nom, contact ou ville..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-3 pl-10 rounded-lg bg-white bg-opacity-10 text-white placeholder-gray-300 focus:ring-2 focus:ring-opacity-70 transition"
        style={{ borderColor: COLORS.borderGlass, focusRing: COLORS.primary }}
      />
    </div>
    {/* Filtres Avancés (Exemple de filtre) */}
    <select
      value={filters.status}
      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      className="p-3 rounded-lg bg-white bg-opacity-10 text-white appearance-none cursor-pointer focus:ring-2 focus:ring-opacity-70 transition"
      style={{ borderColor: COLORS.borderGlass, focusRing: COLORS.primary }}
    >
      <option value="">Tous les Statuts</option>
      <option value="Active">Actifs</option>
      <option value="Duplicate">Doublons</option>
      <option value="Needs Data">Données Manquantes</option>
    </select>
  </div>
);

// --- LOGIQUE DU DASHBOARD PRINCIPAL ---

const PartnerManagementAdmin = () => {
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPartner, setCurrentPartner] = useState(null); // Pour édition/création
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  const { addToast } = useToast();
  const { state: partnersHistory, set: setPartnersWithHistory, undo, redo, canUndo, canRedo } = useUndoRedo(partners);

  // 1. Chargement des données initiales
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await simulateApiCall(initialPartners);
      setPartners(data);
      setPartnersWithHistory(data);
      setIsLoading(false);
      addToast('Bienvenue ! Données des partenaires chargées.', 'success');
    };
    fetchData();
  }, []);

  // Synchronisation de l'état local avec l'état Undo/Redo
  useEffect(() => {
    if (partnersHistory.length > 0) {
      setPartners(partnersHistory);
    }
  }, [partnersHistory]);

  // 2. Statistiques calculées (useMemo pour l'optimisation)
  const stats = useMemo(() => {
    const total = partners.length;
    const unique = new Set(partners.map(p => p.name)).size;
    const duplicates = partners.filter(p => p.status === 'Duplicate').length;
    const missingCity = partners.filter(p => !p.city).length;

    return {
      total,
      unique,
      duplicates,
      missingCity
    };
  }, [partners]);

  // 3. Filtrage et Recherche
  const filteredPartners = useMemo(() => {
    return partners
      .filter(p => {
        const matchesSearch = searchTerm
          ? Object.values(p).some(val =>
              String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
          : true;

        const matchesStatus = filters.status ? p.status === filters.status : true;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.score - a.score); // Tri par score (exemple)
  }, [partners, searchTerm, filters]);

  // 4. CRUD handlers
  const handleSavePartner = useCallback(async (partnerData) => {
    setIsLoading(true);
    let newPartners;
    if (partnerData.id) {
      // Modification (Simuler validation d'adresse/géocodage)
      const updatedPartner = { ...partnerData, score: partnerData.score || 90 };
      newPartners = partners.map(p => p.id === partnerData.id ? updatedPartner : p);
      addToast(`Partenaire ${partnerData.name} mis à jour avec succès.`, 'success');
    } else {
      // Création
      const newId = `p${partners.length + 1}`;
      const newPartner = { ...partnerData, id: newId, status: 'Active', score: 80 };
      newPartners = [...partners, newPartner];
      addToast(`Nouveau partenaire ${partnerData.name} créé.`, 'success');
    }

    await simulateApiCall(null, 300); // Simuler API
    setPartnersWithHistory(newPartners);
    setIsLoading(false);
    setIsModalOpen(false);
  }, [partners, setPartnersWithHistory, addToast]);

  const handleEdit = (partner) => {
    setCurrentPartner(partner);
    setIsModalOpen(true);
  };

  const handleDelete = useCallback(async (id) => {
    setIsLoading(true);
    const newPartners = partners.filter(p => p.id !== id);
    await simulateApiCall(null, 300);
    setPartnersWithHistory(newPartners);
    addToast('Partenaire supprimé. (Action réversible)', 'warning');
    setIsLoading(false);
  }, [partners, setPartnersWithHistory, addToast]);

  // 5. Interface de Fusion (Doublons)
  const handleMergePartners = useCallback(async (sourceId, targetId) => {
    setIsLoading(true);
    // Logique de fusion : garder la cible, supprimer la source, consolider les données
    const targetPartner = partners.find(p => p.id === targetId);
    if (!targetPartner) return;

    const newPartners = partners.filter(p => p.id !== sourceId);
    const updatedTarget = {
      ...targetPartner,
      status: 'Active',
      contact: targetPartner.contact || partners.find(p => p.id === sourceId).contact, // Exemple de consolidation
    };

    const finalPartners = newPartners.map(p => p.id === targetId ? updatedTarget : p);

    await simulateApiCall(null, 500);
    setPartnersWithHistory(finalPartners);
    setIsDuplicateModalOpen(false);
    addToast(`Fusion réussie : ${targetPartner.name} mis à jour.`, 'success');
    setIsLoading(false);
  }, [partners, setPartnersWithHistory, addToast]);

  // --- RENDU ---

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white overflow-hidden">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: COLORS.primary }}>
          PEP'S Admin Dashboard
        </h1>
        <p className="text-gray-400">Gestion et optimisation des Partenariats Exclusifs.</p>
      </header>

      {/* Barre d'Actions Supérieure */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center p-3 rounded-xl font-semibold text-gray-900 transition"
            style={{ backgroundColor: COLORS.primary }}
            onClick={() => { setCurrentPartner(null); setIsModalOpen(true); }}
          >
            <FiPlus className="mr-2" /> Nouveau Partenaire
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center p-3 rounded-xl font-semibold text-white border transition"
            style={{ borderColor: COLORS.accent }}
            onClick={() => setIsDuplicateModalOpen(true)}
            disabled={stats.duplicates === 0}
          >
            <FiAlertTriangle className="mr-2" style={{ color: COLORS.accent }} /> Gérer les Doublons ({stats.duplicates})
          </motion.button>
        </div>
        
        {/* Undo/Redo */}
        <div className="flex space-x-2 text-sm">
          <motion.button
            whileHover={{ scale: 1.05 }}
            className={`p-2 rounded-lg transition ${canUndo ? 'bg-white bg-opacity-10 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
            onClick={undo}
            disabled={!canUndo}
          >
            Annuler (Undo)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className={`p-2 rounded-lg transition ${canRedo ? 'bg-white bg-opacity-10 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
            onClick={redo}
            disabled={!canRedo}
          >
            Rétablir (Redo)
          </motion.button>
        </div>
      </div>

      {/* 1. Vue d'ensemble (Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Partenaires Actuels" value={stats.total} icon={FiUsers} color={COLORS.primary} />
        <StatCard title="Doublons Détectés" value={stats.duplicates} icon={FiAlertTriangle} color={COLORS.accent} />
        <StatCard title="Villes Manquantes" value={stats.missingCity} icon={FiMapPin} color={COLORS.primary} />
        <StatCard title="Export CSV" value="Exporter" icon={FiDownload} color={COLORS.primary} />
      </div>

      {/* 2. Liste des Partenaires */}
      <div className="p-6 rounded-xl shadow-2xl backdrop-blur-xl" style={{ background: COLORS.bgGlass, border: `1px solid ${COLORS.borderGlass}` }}>
        <h2 className="text-2xl font-bold mb-4">Liste des Partenaires</h2>

        <div className="mb-4">
          <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            filters={filters} 
            setFilters={setFilters} 
          />
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <PartnerList 
            partners={filteredPartners} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            accentColor={COLORS.accent}
            primaryColor={COLORS.primary}
          />
        )}
      </div>

      {/* Modals */}
      <PartnerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        partner={currentPartner} 
        onSave={handleSavePartner}
      />
      
      <DuplicateMergerModal 
        isOpen={isDuplicateModalOpen} 
        onClose={() => setIsDuplicateModalOpen(false)} 
        duplicatePartners={partners.filter(p => p.status === 'Duplicate')}
        allPartners={partners}
        onMerge={handleMergePartners}
      />
    </div>
  );
};

// --- COMPOSANTS ENFANTS DÉTAILLÉS (Exemples) ---

// Composant 6: Formulaire de Création/Édition
const PartnerModal = ({ isOpen, onClose, partner, onSave }) => {
  const [formData, setFormData] = useState(partner || {});
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    setFormData(partner || { name: '', city: '', contact: '', logo: '' });
  }, [partner]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    // Simulation d'upload
    addToast('Logo en cours d\'upload...', 'info');
    setTimeout(() => {
      setFormData(prev => ({ ...prev, logo: '/logos/new_upload.png' }));
      addToast('Logo uploadé avec succès!', 'success');
    }, 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contact) {
      addToast('Le nom et le contact sont requis.', 'error');
      return;
    }
    setIsSaving(true);
    onSave(formData).then(() => setIsSaving(false));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={partner ? `Modifier: ${partner.name}` : 'Créer un Nouveau Partenaire'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-300">Nom du Partenaire</label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-white bg-opacity-10 text-white border border-gray-700 focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Validation d'Adresse / Géocodage */}
        <div>
          <label className="block text-sm font-medium text-gray-300">Ville / Adresse (Géocodage Auto)</label>
          <div className="flex">
            <input
              type="text"
              name="city"
              value={formData.city || ''}
              onChange={handleChange}
              placeholder="Ex: Paris"
              className="flex-grow p-3 rounded-l-lg bg-white bg-opacity-10 text-white border border-gray-700 focus:ring-2 focus:ring-teal-500"
            />
            <button type="button" className="p-3 bg-teal-700 rounded-r-lg hover:bg-teal-600 transition">
              <FiMapPin />
            </button>
          </div>
        </div>

        {/* Upload Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-300">Logo/Image</label>
          <input
            type="file"
            onChange={handleLogoUpload}
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
          {formData.logo && (
            <p className="mt-2 text-xs text-gray-400">Logo actuel: {formData.logo.split('/').pop()}</p>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t" style={{ borderColor: COLORS.borderGlass }}>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSaving}
            className={`flex items-center px-6 py-2 rounded-xl font-semibold transition ${isSaving ? 'bg-gray-600' : 'bg-teal-600 hover:bg-teal-500'}`}
          >
            {isSaving ? <LoadingSpinner /> : <><FiCheckCircle className="mr-2" /> Sauvegarder</>}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
};

// Composant 7: Liste des Partenaires (avec animations)
const PartnerList = ({ partners, onEdit, onDelete, accentColor, primaryColor }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-700">
      <thead>
        <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
          <th className="p-3">Nom</th>
          <th className="p-3">Ville</th>
          <th className="p-3">Contact</th>
          <th className="p-3">Score</th>
          <th className="p-3">Statut</th>
          <th className="p-3 text-right">Actions</th>
        </tr>
      </thead>
      <motion.tbody
        layout
        className="divide-y divide-gray-700"
      >
        <AnimatePresence>
          {partners.map((partner) => (
            <motion.tr
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="hover:bg-white hover:bg-opacity-5 transition duration-200"
            >
              <td className="p-3 font-semibold">{partner.name}</td>
              <td className="p-3 text-sm text-gray-300">{partner.city || 'N/A'}</td>
              <td className="p-3 text-sm text-gray-300">{partner.contact}</td>
              <td className="p-3">
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${partner.score > 90 ? 'bg-green-800' : 'bg-yellow-800'}`}>
                  {partner.score}
                </span>
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                  partner.status === 'Duplicate' ? 'bg-red-800' : 
                  partner.status === 'Needs Data' ? 'bg-yellow-700' : 
                  'bg-teal-800'
                }`}
                  style={partner.status === 'Duplicate' ? { backgroundColor: accentColor, color: 'white' } : {}}
                >
                  {partner.status}
                </span>
              </td>
              <td className="p-3 text-right space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => onEdit(partner)}
                  className="p-2 text-gray-300 hover:text-teal-400"
                >
                  <FiEdit />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => onDelete(partner.id)}
                  className="p-2 text-gray-300 hover:text-red-400"
                >
                  <FiTrash2 />
                </motion.button>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </motion.tbody>
    </table>
    {partners.length === 0 && (
      <div className="text-center py-8 text-gray-400">Aucun partenaire trouvé.</div>
    )}
  </div>
);

// Composant 8: Gestion des Doublons (Drag & Drop)
const DuplicateMergerModal = ({ isOpen, onClose, duplicatePartners, allPartners, onMerge }) => {
  const [doubles, setDoubles] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    // Ici, une logique réelle grouperait les doublons.
    // Simulation : grouper p1 et p3 ensemble
    if (duplicatePartners.length > 0) {
        setDoubles([
            { id: 'group1', partners: allPartners.filter(p => p.name === 'Le Café des Artistes') },
        ]);
    }
  }, [duplicatePartners, allPartners]);

  const handleDragStart = (e, partner) => {
    setDraggedItem(partner);
    e.dataTransfer.setData("partnerId", partner.id);
  };

  const handleDrop = (e, targetPartner) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetPartner.id) return;

    // Source : l'élément glissé (celui qu'on va supprimer)
    const sourceId = draggedItem.id;
    // Cible : l'élément sur lequel on lâche (celui qu'on va garder et enrichir)
    const targetId = targetPartner.id;

    if (window.confirm(`Êtes-vous sûr de vouloir fusionner ${draggedItem.name} dans ${targetPartner.name}?`)) {
        onMerge(sourceId, targetId);
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e) => e.preventDefault();

  if (doubles.length === 0) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestion des Doublons" size="lg">
            <p className="text-center py-4 text-gray-300">Aucun doublon actif nécessitant une fusion. Bravo !</p>
        </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestion des Doublons" size="xl">
      <div className="space-y-6">
        {doubles.map(group => (
          <div key={group.id} className="p-4 rounded-lg bg-white bg-opacity-5 border border-gray-700">
            <h3 className="text-lg font-bold mb-3 text-white">Groupe de Doublons: {group.partners[0].name}</h3>
            
            <div className="flex space-x-4">
              {group.partners.map(p => (
                <motion.div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, p)}
                  onDrop={(e) => handleDrop(e, p)}
                  onDragOver={handleDragOver}
                  className={`p-4 rounded-xl shadow-lg cursor-pointer transition w-1/2 ${
                    draggedItem && draggedItem.id === p.id ? 'opacity-50 border-4 border-dashed' : ''
                  }`}
                  style={{ 
                    background: COLORS.bgGlass, 
                    border: `2px solid ${p.status === 'Duplicate' ? COLORS.accent : COLORS.primary}`,
                  }}
                  whileHover={{ scale: 1.03 }}
                >
                  <p className="font-bold text-lg">{p.name}</p>
                  <p className="text-sm text-gray-400">{p.contact}</p>
                  <p className="text-xs mt-2">
                    <span className="font-semibold">Statut:</span> {p.status}
                  </p>
                  {p.status !== 'Duplicate' && (
                      <p className="mt-2 text-xs text-teal-300 font-bold">Déposez ici pour fusionner DANS cet enregistrement.</p>
                  )}
                </motion.div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-400">
                **Instructions:** Glissez un enregistrement (le doublon à supprimer) et déposez-le sur l'enregistrement que vous souhaitez conserver (la cible).
            </p>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default PartnerManagementAdmin;

// --- SIMULATION DES HOOKS (pour la complétude) ---
// Note: Ces hooks devraient être dans des fichiers séparés en production.

// hooks/useToast.js
export const useToast = () => {
    // Simuler un système de notification toast
    const addToast = (message, type = 'info') => {
        console.log(`[TOAST - ${type.toUpperCase()}]: ${message}`);
        // Dans une vraie app, cela afficherait un composant flottant.
    };
    return { addToast };
};

// hooks/useUndoRedo.js
export const useUndoRedo = (initialState) => {
    const [history, setHistory] = useState([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const set = useCallback((newState) => {
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    }, [history, currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, history.length]);

    return {
        state: history[currentIndex],
        set,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
    };
};
