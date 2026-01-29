import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Loader2, Image, CheckCircle, AlertTriangle, Info } from 'lucide-react';

// --- Configuration et Constantes ---

// URL de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL;
// Token d'authentification
const AUTH_TOKEN = localStorage.getItem('token');

// Catégories prédéfinies pour le formulaire
const CATEGORIES = [
    'Restaurant', 'Beauté', 'Sport', 'Loisirs', 'Services', 'Shopping', 'Santé'
];

// Couleurs Tailwind pour le design
const COLORS = {
    primary: 'bg-[#2A9D8F]', // Turquoise
    secondary: 'bg-[#E76F51]', // Corail
    textPrimary: 'text-gray-800',
    border: 'border-gray-200',
};

// --- Hooks Personnalisés ---

/**
 * Hook personnalisé pour gérer l'état et les opérations CRUD des privilèges.
 */
const usePrivileges = () => {
    const [privileges, setPrivileges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fonction générique pour les requêtes API
    const apiFetch = useCallback(async (url, options = {}) => {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`,
        };

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers: { ...defaultHeaders, ...options.headers },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erreur réseau ou serveur' }));
                throw new Error(errorData.message || `Erreur ${response.status}`);
            }

            // Gérer les réponses sans contenu (DELETE)
            if (response.status === 204) return null;

            return await response.json();
        } catch (err) {
            setError(err.message);
            console.error('Erreur API:', err);
            throw err; // Renvoyer l'erreur pour la gestion locale (ex: toast)
        }
    }, []);

    // Chargement initial des privilèges
    const fetchPrivileges = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/api/partner/privileges');
            setPrivileges(data || []);
        } catch (err) {
            // L'erreur est déjà loguée dans apiFetch
            setPrivileges([]);
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch]);

    useEffect(() => {
        fetchPrivileges();
    }, [fetchPrivileges]);

    // Opération de création
    const createPrivilege = async (newPrivilege) => {
        const creationToast = toast.loading('Création du privilège...');
        try {
            const created = await apiFetch('/api/partner/privilege', {
                method: 'POST',
                body: JSON.stringify(newPrivilege),
            });
            setPrivileges(prev => [created, ...prev]);
            toast.success('Privilège créé avec succès !', { id: creationToast });
        } catch (err) {
            toast.error(`Échec de la création: ${err.message}`, { id: creationToast });
            throw err;
        }
    };

    // Opération de modification
    const updatePrivilege = async (id, updatedPrivilege) => {
        const updateToast = toast.loading('Modification en cours...');
        try {
            const updated = await apiFetch(`/api/partner/privilege/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedPrivilege),
            });
            setPrivileges(prev => prev.map(p => (p.id === id ? updated : p)));
            toast.success('Privilège mis à jour !', { id: updateToast });
        } catch (err) {
            toast.error(`Échec de la modification: ${err.message}`, { id: updateToast });
            throw err;
        }
    };

    // Opération de suppression
    const deletePrivilege = async (id) => {
        const deleteToast = toast.loading('Suppression en cours...');
        try {
            await apiFetch(`/api/partner/privilege/${id}`, {
                method: 'DELETE',
            });
            setPrivileges(prev => prev.filter(p => p.id !== id));
            toast.success('Privilège supprimé.', { id: deleteToast });
        } catch (err) {
            toast.error(`Échec de la suppression: ${err.message}`, { id: deleteToast });
            throw err;
        }
    };

    return {
        privileges,
        isLoading,
        error,
        fetchPrivileges,
        createPrivilege,
        updatePrivilege,
        deletePrivilege,
    };
};

// --- Composants Modulaires ---

/**
 * Composant de carte pour afficher un privilège.
 */
const PrivilegeCard = React.memo(({ privilege, onEdit, onDelete }) => {
    const { id, titre, description, avantage, categorie, imageUrl } = privilege;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    return (
        <motion.div
            layout
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${COLORS.border} border`}
        >
            {/* Image de couverture */}
            <div className="h-40 w-full relative">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={`Image de ${titre}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x200?text=Image+Manquante' }}
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${COLORS.primary} bg-opacity-10`}>
                        <Image className="w-12 h-12 text-gray-400" />
                    </div>
                )}
                {/* Badge Avantage */}
                <span className={`absolute top-3 right-3 px-3 py-1 text-sm font-bold text-white rounded-full shadow-md ${COLORS.secondary}`}>
                    {avantage}
                </span>
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <h3 className={`text-xl font-semibold ${COLORS.textPrimary}`}>{titre}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600`}>
                        {categorie}
                    </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEdit(privilege)}
                        className="p-2 rounded-full text-[#2A9D8F] hover:bg-[#2A9D8F] hover:text-white transition-colors"
                        aria-label="Modifier le privilège"
                    >
                        <Edit className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDelete(id)}
                        className="p-2 rounded-full text-[#E76F51] hover:bg-[#E76F51] hover:text-white transition-colors"
                        aria-label="Supprimer le privilège"
                    >
                        <Trash2 className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
});

/**
 * Composant de modal générique pour la confirmation (suppression).
 */
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-[#E76F51] flex items-center">
                        <AlertTriangle className="w-6 h-6 mr-2" /> {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <p className="text-gray-700 mb-6">{message}</p>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-white bg-[#E76F51] rounded-lg hover:bg-red-600 transition-colors font-semibold"
                    >
                        Confirmer la suppression
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

/**
 * Composant de modal pour la création et l'édition d'un privilège.
 */
const PrivilegeModal = ({ isOpen, onClose, onSubmit, initialData }) => {
    const isEditing = !!initialData;
    const [formData, setFormData] = useState(initialData || {
        titre: '',
        description: '',
        avantage: '',
        categorie: CATEGORIES[0],
        imageUrl: '',
        conditions: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFormData(initialData || {
            titre: '',
            description: '',
            avantage: '',
            categorie: CATEGORIES[0],
            imageUrl: '',
            conditions: '',
        });
    }, [initialData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            // L'erreur est gérée par le hook usePrivileges (toast)
        } finally {
            setIsSubmitting(false);
        }
    };

    // Placeholder pour la gestion d'upload d'image (simplifié ici)
    const handleImageUpload = (e) => {
        // Logique d'upload réelle (ex: vers S3 ou un endpoint dédié)
        // Pour cet exemple, nous simulons l'ajout d'une URL
        const file = e.target.files[0];
        if (file) {
            toast('Fonctionnalité d\'upload non implémentée. Utilisez une URL pour l\'instant.', { icon: '⚠️' });
            // setFormData(prev => ({ ...prev, imageUrl: 'URL_TEMPORAIRE_APRES_UPLOAD' }));
        }
    };

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "tween", duration: 0.2 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className={`text-2xl font-bold ${COLORS.textPrimary}`}>
                        {isEditing ? 'Modifier le Privilège' : 'Créer un Nouveau Privilège'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Ligne 1: Titre et Avantage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Titre du Privilège *</span>
                            <input
                                type="text"
                                name="titre"
                                value={formData.titre}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#2A9D8F] focus:ring-[#2A9D8F] p-2 border"
                                placeholder="Ex: Réduction exclusive"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Réduction/Avantage *</span>
                            <input
                                type="text"
                                name="avantage"
                                value={formData.avantage}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#2A9D8F] focus:ring-[#2A9D8F] p-2 border"
                                placeholder="Ex: -20% ou Café offert"
                            />
                        </label>
                    </div>

                    {/* Ligne 2: Catégorie */}
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Catégorie *</span>
                        <select
                            name="categorie"
                            value={formData.categorie}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#2A9D8F] focus:ring-[#2A9D8F] p-2 border bg-white"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </label>

                    {/* Ligne 3: Description */}
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Description détaillée *</span>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows="3"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#2A9D8F] focus:ring-[#2A9D8F] p-2 border"
                            placeholder="Décrivez l'offre et ce qu'elle apporte au client."
                        ></textarea>
                    </label>

                    {/* Ligne 4: Conditions */}
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Conditions d'utilisation (Optionnel)</span>
                        <textarea
                            name="conditions"
                            value={formData.conditions}
                            onChange={handleChange}
                            rows="2"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#2A9D8F] focus:ring-[#2A9D8F] p-2 border"
                            placeholder="Ex: Valable uniquement les mardis, non cumulable."
                        ></textarea>
                    </label>

                    {/* Ligne 5: Image URL (Simplification) */}
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">URL de l'Image (Optionnel)</span>
                        <div className="flex items-center space-x-2">
                            <input
                                type="url"
                                name="imageUrl"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#2A9D8F] focus:ring-[#2A9D8F] p-2 border"
                                placeholder="https://votre-image.com/privilege.jpg"
                            />
                            {/* Bouton d'upload simulé */}
                            <label className="cursor-pointer mt-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center whitespace-nowrap">
                                <Image className="w-5 h-5 mr-1" /> Upload
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </label>

                    {/* Boutons d'action */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-3 rounded-lg text-white font-semibold transition-all duration-200 flex items-center ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : COLORS.primary + ' hover:bg-[#207a6f]'}`}
                        >
                            {isSubmitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                            {isEditing ? 'Sauvegarder les modifications' : 'Créer le privilège'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};


// --- Composant Principal ---

/**
 * Composant principal de gestion des privilèges.
 */
const PrivilegesManager = () => {
    const {
        privileges,
        isLoading,
        error,
        createPrivilege,
        updatePrivilege,
        deletePrivilege,
    } = usePrivileges();

    // États de la Modale
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrivilege, setEditingPrivilege] = useState(null); // null pour création, objet pour édition

    // États de la Confirmation
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [privilegeToDeleteId, setPrivilegeToDeleteId] = useState(null);

    // --- Gestion des Modales ---

    const handleCreateClick = () => {
        setEditingPrivilege(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (privilege) => {
        setEditingPrivilege(privilege);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingPrivilege(null);
    };

    const handleModalSubmit = async (formData) => {
        if (editingPrivilege) {
            // Modification
            await updatePrivilege(editingPrivilege.id, formData);
        } else {
            // Création
            await createPrivilege(formData);
        }
    };

    // --- Gestion de la Suppression ---

    const handleDeleteRequest = (id) => {
        setPrivilegeToDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (privilegeToDeleteId) {
            await deletePrivilege(privilegeToDeleteId);
        }
        setIsConfirmOpen(false);
        setPrivilegeToDeleteId(null);
    };

    const handleCancelDelete = () => {
        setIsConfirmOpen(false);
        setPrivilegeToDeleteId(null);
    };

    // --- Rendu des États ---

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className={`w-10 h-10 ${COLORS.primary.replace('bg', 'text')} animate-spin`} />
                <p className="ml-3 text-lg text-gray-600">Chargement des privilèges...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md">
                <h3 className="font-bold text-lg flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Erreur de chargement</h3>
                <p>Impossible de récupérer les données : {error}</p>
                <p className="text-sm mt-2">Veuillez vérifier votre connexion ou l'URL de l'API.</p>
            </div>
        );
    }

    const hasPrivileges = privileges.length > 0;

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <Toaster position="top-right" reverseOrder={false} />

            {/* En-tête du Dashboard */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <h1 className={`text-3xl font-extrabold ${COLORS.textPrimary}`}>
                    Gestion des Privilèges Permanents
                </h1>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateClick}
                    className={`mt-4 sm:mt-0 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all duration-200 flex items-center ${COLORS.primary} hover:bg-[#207a6f]`}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Créer un privilège
                </motion.button>
            </header>

            {/* Affichage des privilèges */}
            <AnimatePresence mode="wait">
                {!hasPrivileges ? (
                    // Empty State
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center p-12 bg-white rounded-xl shadow-md border border-dashed border-gray-300"
                    >
                        <Info className={`w-12 h-12 mx-auto text-gray-400 mb-4`} />
                        <h2 className="text-xl font-semibold text-gray-700">Aucun privilège trouvé</h2>
                        <p className="text-gray-500 mt-2">
                            Commencez par créer votre première offre exclusive pour vos membres.
                        </p>
                        <button
                            onClick={handleCreateClick}
                            className={`mt-5 px-4 py-2 rounded-lg text-white font-medium ${COLORS.secondary} hover:bg-[#c95c42] transition-colors`}
                        >
                            Créer maintenant
                        </button>
                    </motion.div>
                ) : (
                    // Liste des Cards
                    <motion.div
                        key="list"
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        <AnimatePresence>
                            {privileges.map(privilege => (
                                <PrivilegeCard
                                    key={privilege.id}
                                    privilege={privilege}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteRequest}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modales */}
            <PrivilegeModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
                initialData={editingPrivilege}
            />

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirmer la Suppression"
                message="Êtes-vous sûr de vouloir supprimer ce privilège ? Cette action est irréversible."
            />
        </div>
    );
};

export default PrivilegesManager;
