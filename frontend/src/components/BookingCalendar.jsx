import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const BookingCalendar = ({ partnerId, partnerName }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Générer les jours du mois
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Jours du mois précédent pour remplir
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Générer les créneaux horaires disponibles
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute of [0, 30]) {
        if (hour === 17 && minute === 30) break;
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  useEffect(() => {
    if (selectedDate) {
      // Simuler le chargement des créneaux disponibles
      setLoading(true);
      setTimeout(() => {
        setAvailableSlots(generateTimeSlots());
        setLoading(false);
      }, 500);
    }
  }, [selectedDate]);

  const handleDateClick = (date) => {
    if (!date) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return; // Pas de réservation dans le passé
    
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
  };

  const confirmBooking = async () => {
    if (!selectedDate || !selectedTime || !userName || !userPhone) return;

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://www.peps.swiss/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partner_id: partnerId,
          date: selectedDate.toISOString().split('T')[0],
          time: selectedTime,
          customer_name: userName,
          customer_phone: userPhone
        })
      });

      if (response.ok) {
        setBookingConfirmed(true);
        // Réinitialiser après 5 secondes
        setTimeout(() => {
          setBookingConfirmed(false);
          setSelectedDate(null);
          setSelectedTime(null);
          setUserName('');
          setUserPhone('');
        }, 5000);
      }
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const days = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (bookingConfirmed) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto animate-scale-in">
            <Check className="w-12 h-12 text-white" />
          </div>
          {/* Animation d'étoiles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-star-burst"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${i * 30}deg) translateY(-60px)`,
                  animationDelay: `${i * 0.1}s`
                }}
              >
                ✨
              </div>
            ))}
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Réservation confirmée !</h3>
        <p className="text-gray-600 mb-1">
          📅 {selectedDate?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <p className="text-gray-600 mb-4">🕐 {selectedTime}</p>
        <p className="text-sm text-gray-500">
          Un email de confirmation a été envoyé à {userName}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendrier */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border border-gray-100">
        {/* En-tête du calendrier */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          
          <h3 className="text-xl font-bold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Noms des jours */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            const isSelected = selectedDate && date && date.toDateString() === selectedDate.toDateString();
            const isTodayDate = isToday(date);
            const isPastDate = isPast(date);
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={!date || isPastDate}
                className={`
                  aspect-square rounded-xl flex items-center justify-center text-sm font-medium
                  transition-all duration-200 transform
                  ${!date ? 'invisible' : ''}
                  ${isPastDate ? 'text-gray-300 cursor-not-allowed' : ''}
                  ${isSelected 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-110' 
                    : isTodayDate
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : !isPastDate
                    ? 'hover:bg-gray-100 text-gray-700 hover:scale-105'
                    : ''
                  }
                `}
              >
                {date?.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Créneaux horaires */}
      {selectedDate && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border border-gray-100 animate-slide-up">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-emerald-600 mr-2" />
            <h4 className="text-lg font-bold text-gray-900">
              Choisissez votre horaire
            </h4>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
              {availableSlots.map(time => (
                <button
                  key={time}
                  onClick={() => handleTimeClick(time)}
                  className={`
                    py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 transform
                    ${selectedTime === time
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300 hover:scale-105'
                    }
                  `}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulaire de confirmation */}
      {selectedTime && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border border-gray-100 animate-slide-up">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-emerald-600 mr-2" />
            <h4 className="text-lg font-bold text-gray-900">
              Vos informations
            </h4>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Jean Dupont"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="+41 79 123 45 67"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>
          </div>

          <button
            onClick={confirmBooking}
            disabled={!userName || !userPhone || loading}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 transform
              ${userName && userPhone && !loading
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:scale-105 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Confirmation...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Confirmer la réservation
              </span>
            )}
          </button>
        </div>
      )}

      {/* CSS pour les animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes star-burst {
          0% {
            opacity: 0;
            transform: rotate(var(--rotation)) translateY(0) scale(0);
          }
          50% {
            opacity: 1;
            transform: rotate(var(--rotation)) translateY(-60px) scale(1.5);
          }
          100% {
            opacity: 0;
            transform: rotate(var(--rotation)) translateY(-100px) scale(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
        .animate-star-burst {
          animation: star-burst 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BookingCalendar;
