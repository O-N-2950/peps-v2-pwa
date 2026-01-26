import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Settings, Users, CheckCircle, XCircle, Plus, Edit, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PartnerBookingDashboard({ partnerId }) {
  const [activeTab, setActiveTab] = useState('bookings'); // bookings, services, config
  const [config, setConfig] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    loadData();
  }, [partnerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadConfig(),
        loadServices(),
        loadBookings()
      ]);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    const res = await fetch(`${API_URL}/api/partner/${partnerId}/booking/config`);
    const data = await res.json();
    if (data.success) setConfig(data.config);
  };

  const loadServices = async () => {
    const res = await fetch(`${API_URL}/api/partner/${partnerId}/services`);
    const data = await res.json();
    if (data.success) setServices(data.services);
  };

  const loadBookings = async () => {
    const res = await fetch(`${API_URL}/api/partner/${partnerId}/bookings`);
    const data = await res.json();
    if (data.success) setBookings(data.bookings);
  };

  const toggleBookingSystem = async () => {
    const newStatus = !config.is_enabled;
    const res = await fetch(`${API_URL}/api/partner/${partnerId}/booking/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_enabled: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      setConfig(data.config);
      alert(newStatus ? '✅ Système de réservation activé !' : '⚠️ Système de réservation désactivé');
    }
  };

  const deleteService = async (serviceId) => {
    if (!confirm('Supprimer ce service ?')) return;
    const res = await fetch(`${API_URL}/api/partner/${partnerId}/services/${serviceId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ Service supprimé');
      loadServices();
    }
  };

  const cancelBooking = async (bookingId) => {
    const reason = prompt('Raison de l\'annulation :');
    if (!reason) return;
    
    const res = await fetch(`${API_URL}/api/partner/${partnerId}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ Réservation annulée');
      loadBookings();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="text-blue-600" size={32} />
                Système de Réservation
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez vos réservations et vos services en ligne
              </p>
            </div>
            <button
              onClick={toggleBookingSystem}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                config?.is_enabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              }`}
            >
              {config?.is_enabled ? '✅ Activé' : '⚠️ Désactivé'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'bookings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="inline mr-2" size={18} />
                Réservations ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'services'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="inline mr-2" size={18} />
                Services ({services.length})
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'config'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="inline mr-2" size={18} />
                Configuration
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Réservations */}
            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Réservations à venir</h2>
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Aucune réservation pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.status === 'confirmed' ? '✓ Confirmée' : '✗ Annulée'}
                              </span>
                              <span className="text-gray-600">
                                {new Date(booking.booking_date).toLocaleString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              {booking.service_id ? services.find(s => s.id === booking.service_id)?.name : 'Réservation'}
                            </p>
                            <div className="mt-2 text-sm text-gray-600 space-y-1">
                              <p>👤 {booking.number_of_people} personne(s)</p>
                              <p>⏱️ Durée : {booking.duration_minutes} min</p>
                              {booking.price_final > 0 && (
                                <p className="font-semibold text-green-600">
                                  💰 {booking.price_final} CHF
                                  {booking.discount_applied > 0 && (
                                    <span className="ml-2 text-gray-500 line-through">
                                      {booking.price_original} CHF
                                    </span>
                                  )}
                                </p>
                              )}
                              {booking.member_notes && (
                                <p className="italic">📝 {booking.member_notes}</p>
                              )}
                            </div>
                          </div>
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => cancelBooking(booking.id)}
                              className="ml-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <XCircle size={18} className="inline mr-1" />
                              Annuler
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Services */}
            {activeTab === 'services' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Mes Services</h2>
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setShowServiceModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={18} className="inline mr-1" />
                    Ajouter un service
                  </button>
                </div>

                {services.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Aucun service configuré</p>
                    <button
                      onClick={() => setShowServiceModal(true)}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Créer mon premier service
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingService(service);
                                setShowServiceModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => deleteService(service.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        {service.description && (
                          <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                        )}
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold text-lg text-blue-600">
                            {service.price} CHF
                            {service.peps_discount_percent > 0 && (
                              <span className="ml-2 text-sm text-green-600">
                                -{service.peps_discount_percent}% membres PEP'S
                              </span>
                            )}
                          </p>
                          <p className="text-gray-600">⏱️ {service.duration_minutes} minutes</p>
                          <p className="text-gray-600">👥 Capacité : {service.capacity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Configuration */}
            {activeTab === 'config' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Configuration du système</h2>
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Mode de réservation</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Mode actuel : <span className="font-semibold">{config?.booking_mode === 'catalog' ? 'Catalogue de services' : 'Créneaux simples'}</span>
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Paramètres généraux</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>📅 Réservations jusqu'à {config?.advance_booking_days} jours à l'avance</p>
                      <p>⏰ Délai minimum : {config?.min_notice_hours} heures</p>
                      <p>🔄 Annulation gratuite jusqu'à {config?.cancellation_hours}h avant</p>
                      <p>👥 Réservations simultanées : {config?.max_concurrent_bookings}</p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Google Calendar</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Synchronisez vos réservations avec Google Calendar
                    </p>
                    <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                      🔗 Connecter Google Calendar (Bientôt disponible)
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Notifications</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>📧 Email : {config?.notification_email || 'Non configuré'}</p>
                      <p>📱 Téléphone : {config?.notification_phone || 'Non configuré'}</p>
                      <p>✉️ Notifications email : {config?.send_email_notifications ? 'Activées' : 'Désactivées'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Création/Édition Service */}
      {showServiceModal && (
        <ServiceModal
          service={editingService}
          partnerId={partnerId}
          onClose={() => {
            setShowServiceModal(false);
            setEditingService(null);
          }}
          onSave={() => {
            setShowServiceModal(false);
            setEditingService(null);
            loadServices();
          }}
        />
      )}
    </div>
  );
}

// Modal pour créer/éditer un service
function ServiceModal({ service, partnerId, onClose, onSave }) {
  const [formData, setFormData] = useState(
    service || {
      name: '',
      description: '',
      price: '',
      peps_discount_percent: '',
      duration_minutes: '30',
      capacity: '1'
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = service
        ? `${API_URL}/api/partner/${partnerId}/services/${service.id}`
        : `${API_URL}/api/partner/${partnerId}/services`;
      
      const res = await fetch(url, {
        method: service ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        alert(service ? '✅ Service modifié' : '✅ Service créé');
        onSave();
      } else {
        alert('❌ Erreur : ' + data.error);
      }
    } catch (error) {
      alert('❌ Erreur : ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {service ? 'Modifier le service' : 'Nouveau service'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du service *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Coupe + Coloration"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Décrivez votre service..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix (CHF) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="120.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Réduction PEP'S (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.peps_discount_percent}
                  onChange={(e) => setFormData({ ...formData, peps_discount_percent: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée (minutes) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacité
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : service ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
