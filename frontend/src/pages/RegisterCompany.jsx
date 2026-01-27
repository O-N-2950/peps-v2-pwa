import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Building2, MapPin, Mail, Phone, Calendar, User, TrendingDown } from 'lucide-react';

const RegisterCompany = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'CH',
    contactFirstName: '',
    contactLastName: '',
    contactBirthDate: '',
    contactEmail: '',
    contactMobile: '',
    accessCount: 5
  });

  const [currency, setCurrency] = useState('CHF');
  const [validationState, setValidationState] = useState({});
  const [progress, setProgress] = useState(0);

  // Grille tarifaire COMPLÈTE et EXACTE de PEP'S (référence officielle)
  const pricingTiers = [
    { min: 1, max: 1, pricePerUnit: 49.00, total: 49 },
    { min: 2, max: 2, pricePerUnit: 44.50, total: 89 },
    { min: 3, max: 3, pricePerUnit: 43.00, total: 129 },
    { min: 4, max: 4, pricePerUnit: 41.00, total: 164 },
    { min: 5, max: 5, pricePerUnit: 39.80, total: 199 },
    { min: 6, max: 6, pricePerUnit: 40.83, total: 245 },
    { min: 7, max: 7, pricePerUnit: 41.29, total: 289 },
    { min: 8, max: 8, pricePerUnit: 41.25, total: 330 },
    { min: 9, max: 9, pricePerUnit: 40.00, total: 360 },
    { min: 10, max: 10, pricePerUnit: 39.00, total: 390 },
    { min: 11, max: 11, pricePerUnit: 38.50, total: (count) => Math.round(count * 38.5) },
    { min: 12, max: 12, pricePerUnit: 38.33, total: 460 },
    { min: 13, max: 14, pricePerUnit: 37.50, total: (count) => Math.round(count * 37.5) },
    { min: 15, max: 15, pricePerUnit: 36.67, total: 550 },
    { min: 16, max: 19, pricePerUnit: 35.50, total: (count) => Math.round(count * 35.5) },
    { min: 20, max: 20, pricePerUnit: 35.00, total: 700 },
    { min: 21, max: 24, pricePerUnit: 34.50, total: (count) => Math.round(count * 34.5) },
    { min: 25, max: 25, pricePerUnit: 34.00, total: 850 },
    { min: 26, max: 29, pricePerUnit: 33.67, total: (count) => Math.round(count * 33.67) },
    { min: 30, max: 30, pricePerUnit: 33.33, total: 1000 },
    { min: 31, max: 39, pricePerUnit: 32.50, total: (count) => Math.round(count * 32.5) },
    { min: 40, max: 40, pricePerUnit: 32.00, total: 1280 },
    { min: 41, max: 49, pricePerUnit: 31.00, total: (count) => Math.round(count * 31) },
    { min: 50, max: 50, pricePerUnit: 30.00, total: 1500 },
    { min: 51, max: 74, pricePerUnit: 28.00, total: (count) => Math.round(count * 28) },
    { min: 75, max: 75, pricePerUnit: 26.67, total: 2000 },
    { min: 76, max: 99, pricePerUnit: 25.50, total: (count) => Math.round(count * 25.5) },
    { min: 100, max: 100, pricePerUnit: 25.00, total: 2500 },
    { min: 101, max: 149, pricePerUnit: 23.00, total: (count) => Math.round(count * 23) },
    { min: 150, max: 150, pricePerUnit: 22.00, total: 3300 },
    { min: 151, max: 199, pricePerUnit: 21.00, total: (count) => Math.round(count * 21) },
    { min: 200, max: 200, pricePerUnit: 20.00, total: 4000 },
    { min: 201, max: 299, pricePerUnit: 19.00, total: (count) => Math.round(count * 19) },
    { min: 300, max: 300, pricePerUnit: 18.00, total: 5400 },
    { min: 301, max: 400, pricePerUnit: 18.00, total: (count) => Math.round(count * 18) },
    { min: 401, max: 499, pricePerUnit: 16.00, total: (count) => Math.round(count * 16) },
    { min: 500, max: 500, pricePerUnit: 15.00, total: 7500 },
    { min: 501, max: 749, pricePerUnit: 13.00, total: (count) => Math.round(count * 13) },
    { min: 750, max: 750, pricePerUnit: 12.00, total: 9000 },
    { min: 751, max: 999, pricePerUnit: 12.00, total: (count) => Math.round(count * 12) },
    { min: 1000, max: 1000, pricePerUnit: 12.00, total: 12000 },
    { min: 1001, max: 2499, pricePerUnit: 11.00, total: (count) => Math.round(count * 11) },
    { min: 2500, max: 2500, pricePerUnit: 10.00, total: 25000 },
    { min: 2501, max: 4999, pricePerUnit: 9.00, total: (count) => Math.round(count * 9) },
    { min: 5000, max: 5000, pricePerUnit: 8.00, total: 40000 },
    { min: 5001, max: 10000, pricePerUnit: 7.00, total: (count) => Math.round(count * 7) }
  ];

  const calculatePrice = (count) => {
    const tier = pricingTiers.find(t => count >= t.min && count <= t.max);
    if (!tier) return { total: 0, perUnit: 0 };
    
    const total = typeof tier.total === 'function' ? tier.total(count) : tier.total;
    return { total, perUnit: tier.pricePerUnit };
  };

  const currentPrice = calculatePrice(formData.accessCount);
  const savings = (49 * formData.accessCount) - currentPrice.total;

  // Détection automatique du pays/monnaie
  useEffect(() => {
    const detectedCurrency = formData.country === 'CH' ? 'CHF' : 'EUR';
    setCurrency(detectedCurrency);
  }, [formData.country]);

  // Calcul de la progression
  useEffect(() => {
    const fields = Object.keys(formData);
    const filledFields = fields.filter(key => formData[key] !== '').length;
    setProgress((filledFields / fields.length) * 100);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    setFormData(prev => ({ ...prev, accessCount: value }));
  };

  const validateField = (name, value) => {
    let isValid = false;

    switch (name) {
      case 'contactEmail':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case 'contactMobile':
        isValid = /^[+]?[\d\s()-]{10,}$/.test(value);
        break;
      case 'companyName':
      case 'contactFirstName':
      case 'contactLastName':
      case 'city':
        isValid = value.length >= 2;
        break;
      case 'postalCode':
        isValid = value.length >= 4;
        break;
      case 'address':
        isValid = value.length >= 5;
        break;
      case 'contactBirthDate':
        isValid = value !== '';
        break;
      default:
        isValid = value !== '';
    }

    setValidationState(prev => ({ ...prev, [name]: isValid }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Animation de confettis
    createConfetti();
    
    // Redirection vers le paiement
    setTimeout(() => {
      navigate('/payment', { 
        state: { 
          formData, 
          accessCount: formData.accessCount,
          price: currentPrice,
          currency 
        } 
      });
    }, 1500);
  };

  const createConfetti = () => {
    const colors = ['#10b981', '#14b8a6', '#f26d7d'];
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate('/register/select')}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          
          {/* Barre de progression */}
          <div className="flex-1 max-w-md mx-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {Math.round(progress)}% complété
            </p>
          </div>
          
          <div className="w-20" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Inscription Entreprise
              </h1>
              <p className="text-gray-600 mb-8">
                Offre PEP'S à tes équipes et fidélise tes collaborateurs
              </p>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Informations Entreprise */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-600" />
                    Informations Entreprise
                  </h3>
                  
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Nom de l'entreprise"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.companyName === true
                          ? 'border-teal-500 bg-teal-50'
                          : validationState.companyName === false
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                    {validationState.companyName && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 animate-scale-in" />
                    )}
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="address"
                      placeholder="Adresse"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.address === true
                          ? 'border-teal-500 bg-teal-50'
                          : validationState.address === false
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                    {validationState.address && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 animate-scale-in" />
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="postalCode"
                      placeholder="NPA"
                      value={formData.postalCode}
                      onChange={handleChange}
                      required
                      className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.postalCode === true
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />

                    <input
                      type="text"
                      name="city"
                      placeholder="Localité"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.city === true
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                  </div>

                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none transition-all duration-300"
                  >
                    <option value="CH">🇨🇭 Suisse</option>
                    <option value="FR">🇫🇷 France</option>
                    <option value="BE">🇧🇪 Belgique</option>
                  </select>
                </div>

                {/* Personne de Contact */}
                <div className="space-y-4 pt-6 border-t-2 border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-600" />
                    Personne de Contact
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="contactFirstName"
                      placeholder="Prénom"
                      value={formData.contactFirstName}
                      onChange={handleChange}
                      required
                      className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.contactFirstName === true
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />

                    <input
                      type="text"
                      name="contactLastName"
                      placeholder="Nom"
                      value={formData.contactLastName}
                      onChange={handleChange}
                      required
                      className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.contactLastName === true
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      name="contactBirthDate"
                      value={formData.contactBirthDate}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.contactBirthDate === true
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="contactEmail"
                      placeholder="Email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.contactEmail === true
                          ? 'border-teal-500 bg-teal-50'
                          : validationState.contactEmail === false
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                    {validationState.contactEmail && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 animate-scale-in" />
                    )}
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="contactMobile"
                      placeholder="Numéro de mobile"
                      value={formData.contactMobile}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.contactMobile === true
                          ? 'border-teal-500 bg-teal-50'
                          : validationState.contactMobile === false
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-teal-500'
                      }`}
                    />
                    {validationState.contactMobile && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 animate-scale-in" />
                    )}
                  </div>
                </div>

                {/* Bouton de soumission */}
                <button
                  type="submit"
                  disabled={progress < 100}
                  className={`w-full py-4 rounded-xl font-semibold text-white text-lg transition-all duration-300 ${
                    progress === 100
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:shadow-xl hover:scale-105'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Continuer vers le paiement
                </button>
              </form>
            </div>
          </div>

          {/* Barre latérale - Package */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {/* Sélecteur d'accès */}
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <h3 className="text-xl font-bold mb-4">Nombre d'accès</h3>
                
                <div className="mb-6">
                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={formData.accessCount}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg appearance-none cursor-pointer slider"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1</span>
                    <span>500+</span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-teal-600 mb-2">
                    {formData.accessCount}
                  </div>
                  <div className="text-gray-600">
                    {formData.accessCount === 1 ? 'accès' : 'accès'}
                  </div>
                </div>

                {/* Prix */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 mb-4">
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-4xl font-bold text-teal-600">
                      {currentPrice.total}
                    </span>
                    <span className="text-2xl text-gray-600">{currency}</span>
                  </div>
                  
                  <div className="text-center text-gray-600 mb-4">
                    soit {currentPrice.perUnit} {currency} / accès
                  </div>

                  {savings > 0 && (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold">
                      <TrendingDown className="w-5 h-5" />
                      <span>Tu économises {savings} {currency} !</span>
                    </div>
                  )}
                </div>

                {/* Avantages */}
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Accès illimité 1 an</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">+100 Partenaires</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Codes transférables</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Facturation Pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Tableau de bord entreprise</span>
                  </li>
                </ul>

                {formData.accessCount > 500 && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-800">
                      💼 Pour plus de 500 accès, contacte notre équipe commerciale pour une offre sur mesure.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0) translateY(-50%);
          }
          to {
            transform: scale(1) translateY(-50%);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .confetti {
          position: fixed;
          width: 10px;
          height: 10px;
          top: -10px;
          z-index: 9999;
          animation: confetti-fall 2s ease-out forwards;
        }

        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: white;
          border: 3px solid #14b8a6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: white;
          border: 3px solid #14b8a6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
        }
      `}</style>
    </div>
  );
};

export default RegisterCompany;
