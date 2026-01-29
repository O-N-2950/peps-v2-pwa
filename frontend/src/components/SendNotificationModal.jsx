import React, { useState } from 'react';
import Modal from './Modal';
import { Bell, Link as LinkIcon, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SendNotificationModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    link: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/partner/notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Notification envoyée à ${data.sent_to || 0} followers ! 🎉`);
        setFormData({ title: '', message: '', link: '' });
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📣 Envoyer une Notification Push" maxWidth="700px">
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-purple-800">
          <strong>💡 Astuce :</strong> Vos notifications seront envoyées uniquement aux membres qui vous ont ajouté en favori (⭐).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titre */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Titre de la notification *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Nouvelle offre exclusive !"
            maxLength={50}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">{formData.title.length}/50 caractères</p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            required
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Écrivez votre message ici..."
            rows={4}
            maxLength={200}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">{formData.message.length}/200 caractères</p>
        </div>

        {/* Lien optionnel */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <LinkIcon size={16} />
            Lien (optionnel)
          </label>
          <input
            type="url"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="https://..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Ajoutez un lien vers votre site, une offre spéciale, etc.
          </p>
        </div>

        {/* Prévisualisation */}
        {(formData.title || formData.message) && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 mb-2">PRÉVISUALISATION</p>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-start gap-3">
                <Bell size={20} className="text-purple-600 mt-1" />
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{formData.title || 'Titre...'}</p>
                  <p className="text-sm text-gray-600 mt-1">{formData.message || 'Message...'}</p>
                  {formData.link && (
                    <p className="text-xs text-purple-600 mt-2">🔗 {formData.link}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Envoi...
              </>
            ) : (
              <>
                <Send size={20} />
                Envoyer la Notification
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
