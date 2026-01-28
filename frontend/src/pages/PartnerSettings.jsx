import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PartnerSettings = () => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmation.toUpperCase() !== 'SUPPRIMER') {
      alert('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete('/api/partner/delete-account', {
        headers: { Authorization: `Bearer ${token}` },
        data: { confirmation: confirmation }
      });
      
      alert(response.data.message);
      localStorage.removeItem('token');
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/partner-dashboard')}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center"
          >
            ← Retour au dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres partenaire</h1>
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/partner-profile')}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="font-medium">Modifier mon commerce</span>
              <span className="text-gray-500 text-sm block">Nom, adresse, horaires, contact</span>
            </button>
            <button
              onClick={() => navigate('/partner-privileges')}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="font-medium">Gérer mes privilèges</span>
              <span className="text-gray-500 text-sm block">Ajouter, modifier ou supprimer des privilèges</span>
            </button>
            <button
              onClick={() => navigate('/partner-password')}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="font-medium">Changer mon mot de passe</span>
            </button>
          </div>
        </div>

        {/* Zone dangereuse */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Zone dangereuse</h2>
          <p className="text-gray-700 mb-4">
            La suppression de votre compte partenaire est définitive et irréversible. 
            Toutes vos données (commerce, privilèges, statistiques) seront supprimées.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-danger w-full"
          >
            Supprimer mon compte partenaire
          </button>
        </div>
      </div>

      {/* Modale de confirmation suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              ⚠️ Supprimer définitivement votre compte
            </h3>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium mb-2">
                Cette action est irréversible !
              </p>
              <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                <li>Votre commerce sera supprimé de PEP's</li>
                <li>Tous vos privilèges seront supprimés</li>
                <li>Vos statistiques seront perdues</li>
                <li>Vous ne pourrez plus accéder à votre compte</li>
              </ul>
            </div>

            <p className="text-gray-700 mb-4">
              Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :
            </p>

            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Tapez SUPPRIMER"
              className="input-native w-full mb-6"
              autoFocus
            />

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmation('');
                }}
                className="flex-1 btn-secondary"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 btn-danger"
                disabled={deleting || confirmation.toUpperCase() !== 'SUPPRIMER'}
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerSettings;
