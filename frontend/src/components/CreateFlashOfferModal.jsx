import React, { useState } from 'react';
import Modal from './Modal';
import { Zap, Upload, Percent, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CreateFlashOfferModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    duration: '24',
    image: null
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('discount', formData.discount);
      formDataToSend.append('duration', formData.duration);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await fetch(`${API_URL}/api/partner/offers/flash`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Offre flash créée avec succès ! 🎉');
        setFormData({ title: '', description: '', discount: '', duration: '24', image: null });
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création offre flash:', error);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚡ Créer une Offre Flash" maxWidth="700px">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titre */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Titre de l'offre *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: -50% sur tous les massages !"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description détaillée *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Décrivez votre offre flash en détail..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Réduction et Durée */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Percent size={16} />
              Réduction (%) *
            </label>
            <input
              type="number"
              required
              min="1"
              max="100"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              placeholder="50"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Clock size={16} />
              Durée (heures) *
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="6">6 heures</option>
              <option value="12">12 heures</option>
              <option value="24">24 heures</option>
              <option value="48">48 heures</option>
              <option value="72">72 heures</option>
            </select>
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Upload size={16} />
            Image (optionnelle)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 transition-colors cursor-pointer"
          />
          {formData.image && (
            <p className="mt-2 text-sm text-gray-600">
              ✓ {formData.image.name}
            </p>
          )}
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-bold hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Création...
              </>
            ) : (
              <>
                <Zap size={20} />
                Créer l'Offre Flash
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
