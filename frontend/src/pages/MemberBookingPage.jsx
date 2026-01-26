import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Star, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MemberBookingPage({ partnerId, memberId }) {
  const [step, setStep] = useState(1); // 1: Service, 2: Date, 3: Confirmation
  const [partner, setPartner] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCreneau, setSelectedCreneau] = useState(null);
  const [creneaux, setCreneaux] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [memberNotes, setMemberNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    loadPartnerData();
  }, [partnerId]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailability();
    }
  }, [selectedDate, selectedService]);

  const loadPartnerData = async () => {
    setLoading(true);
    try {
      // Charger les infos du partenaire
      const partnerRes = await fetch(`${API_URL}/api/partners/${partnerId}`);
      const partnerData = await partnerRes.json();
      if (partnerData.success) setPartner(partnerData.partner);

      // Charger les services
      const servicesRes = await fetch(`${API_URL}/api/partner/${partnerId}/services`);
      const servicesData = await servicesRes.json();
      if (servicesData.success) setServices(servicesData.services);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      
      const res = await fetch(
        `${API_URL}/api/member/partners/${partnerId}/availability?year=${year}&month=${month}&service_id=${selectedService.id}`
      );
      const data = await res.json();
      
      if (data.success) {
        // Filtrer les créneaux pour la date sélectionnée
        const dateStr = selectedDate.toISOString().split('T')[0];
        const dayCreneaux = data.creneaux.filter(c => 
          c.start_utc.startsWith(dateStr)
        );
        setCreneaux(dayCreneaux);
      }
    } catch (error) {
      console.error('Erreur disponibilités:', error);
    }
  };

  const createBooking = async () => {
    setBooking(true);
    try {
      const res = await fetch(`${API_URL}/api/member/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          partner_id: partnerId,
          service_id: selectedService.id,
          creneau_id: selectedCreneau.id,
          number_of_people: numberOfPeople,
          member_notes: memberNotes
        })
      });

      const data = await res.json();
      
      if (data.success) {
        alert('✅ Réservation confirmée !');
        // Rediriger vers l'historique ou afficher un message de succès
        window.location.href = '/dashboard';
      } else {
        alert('❌ Erreur : ' + data.error);
      }
    } catch (error) {
      alert('❌ Erreur : ' + error.message);
    } finally {
      setBooking(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Jours vides avant le 1er du mois
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const calculateFinalPrice = () => {
    if (!selectedService) return 0;
    
    let price = selectedService.price;
    
    if (selectedService.peps_discount_percent > 0) {
      price -= price * (selectedService.peps_discount_percent / 100);
    } else if (selectedService.peps_discount_amount > 0) {
      price -= selectedService.peps_discount_amount;
    }
    
    return price.toFixed(2);
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
      <div className="max-w-4xl mx-auto">
        {/* Header avec infos du partenaire */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            {partner?.image_url && (
              <img
                src={partner.image_url}
                alt={partner.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{partner?.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin size={16} />
                  {partner?.city}
                </span>
                <span className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-500" />
                  {partner?.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="font-semibold">Service</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center gap-3 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="font-semibold">Date & Heure</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center gap-3 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="font-semibold">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Étape 1 : Sélection du service */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Choisissez votre service</h2>
            
            {services.length === 0 ? (
              <p className="text-center text-gray-500 py-12">
                Aucun service disponible pour le moment
              </p>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedService?.id === service.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock size={16} />
                            {service.duration_minutes} min
                          </span>
                          <span className="font-semibold text-lg text-blue-600">
                            {service.price} CHF
                          </span>
                          {service.peps_discount_percent > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              -{service.peps_discount_percent}% membre PEP'S
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedService?.id === service.id && (
                        <Check className="text-blue-600" size={24} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Étape 2 : Sélection de la date et de l'heure */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ChevronLeft size={20} />
              Retour aux services
            </button>

            <h2 className="text-xl font-bold mb-4">Choisissez une date</h2>

            {/* Calendrier */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-semibold">
                  {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                
                {getDaysInMonth(currentMonth).map((date, index) => (
                  <button
                    key={index}
                    disabled={!date || date < new Date()}
                    onClick={() => date && setSelectedDate(date)}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                      !date
                        ? 'invisible'
                        : date < new Date()
                        ? 'text-gray-300 cursor-not-allowed'
                        : selectedDate?.toDateString() === date.toDateString()
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    {date?.getDate()}
                  </button>
                ))}
              </div>
            </div>

            {/* Créneaux horaires */}
            {selectedDate && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Créneaux disponibles le {selectedDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </h3>

                {creneaux.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Aucun créneau disponible pour cette date
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {creneaux.map((creneau) => (
                      <button
                        key={creneau.id}
                        onClick={() => {
                          setSelectedCreneau(creneau);
                          setStep(3);
                        }}
                        className={`py-3 px-4 rounded-lg font-medium transition-all ${
                          selectedCreneau?.id === creneau.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-blue-50 text-gray-700'
                        }`}
                      >
                        {new Date(creneau.start_utc).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Étape 3 : Confirmation */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ChevronLeft size={20} />
              Retour au calendrier
            </button>

            <h2 className="text-xl font-bold mb-6">Confirmez votre réservation</h2>

            <div className="space-y-6">
              {/* Récapitulatif */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Service :</span> {selectedService?.name}</p>
                  <p><span className="font-medium">Date :</span> {selectedDate?.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</p>
                  <p><span className="font-medium">Heure :</span> {selectedCreneau && new Date(selectedCreneau.start_utc).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  <p><span className="font-medium">Durée :</span> {selectedService?.duration_minutes} minutes</p>
                  <div className="pt-2 border-t border-gray-300 mt-3">
                    <p className="text-lg font-bold text-blue-600">
                      Prix : {calculateFinalPrice()} CHF
                      {selectedService?.peps_discount_percent > 0 && (
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          {selectedService.price} CHF
                        </span>
                      )}
                    </p>
                    {selectedService?.peps_discount_percent > 0 && (
                      <p className="text-sm text-green-600 font-semibold">
                        ✓ Réduction membre PEP'S : -{selectedService.peps_discount_percent}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Nombre de personnes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de personnes
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedService?.capacity || 10}
                  value={numberOfPeople}
                  onChange={(e) => setNumberOfPeople(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes ou demandes spéciales (optionnel)
                </label>
                <textarea
                  value={memberNotes}
                  onChange={(e) => setMemberNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Allergie, préférence, etc."
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={createBooking}
                  disabled={booking}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  {booking ? 'Réservation en cours...' : '✓ Confirmer la réservation'}
                </button>
              </div>

              {/* Info paiement */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">ℹ️ Paiement sur place</p>
                <p>Vous paierez directement chez le commerçant après votre prestation.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
