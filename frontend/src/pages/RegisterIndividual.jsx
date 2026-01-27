import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, MapPin, Mail, Phone, Calendar, User } from 'lucide-react';

const RegisterIndividual = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    address: '',
    email: '',
    mobile: '',
    package: 'basic'
  });

  const [country, setCountry] = useState('CH');
  const [currency, setCurrency] = useState('CHF');
  const [validationState, setValidationState] = useState({});
  const [progress, setProgress] = useState(0);

  // Packages disponibles
  const packages = [
    {
      id: 'basic',
      name: 'Accès Individuel',
      price: 49,
      features: [
        'Accès à tous les privilèges',
        'Carte interactive',
        'Notifications personnalisées',
        'Application PWA'
      ],
      popular: true
    }
  ];

  // Détection automatique du pays/monnaie
  useEffect(() => {
    // Simuler la détection géographique
    // En production, utiliser une API de géolocalisation
    const detectedCountry = 'CH'; // Par défaut Suisse
    setCountry(detectedCountry);
    setCurrency(detectedCountry === 'CH' ? 'CHF' : 'EUR');
  }, []);

  // Calcul de la progression
  useEffect(() => {
    const fields = Object.keys(formData);
    const filledFields = fields.filter(key => formData[key] !== '').length;
    setProgress((filledFields / fields.length) * 100);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validation en temps réel
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let isValid = false;

    switch (name) {
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case 'mobile':
        isValid = /^[+]?[\d\s()-]{10,}$/.test(value);
        break;
      case 'firstName':
      case 'lastName':
        isValid = value.length >= 2;
        break;
      case 'birthDate':
        isValid = value !== '';
        break;
      case 'address':
        isValid = value.length >= 5;
        break;
      case 'gender':
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
      navigate('/payment', { state: { formData, package: packages.find(p => p.id === formData.package), currency } });
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

  const selectedPackage = packages.find(p => p.id === formData.package);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate('/register/select')}
            className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          
          {/* Barre de progression */}
          <div className="flex-1 max-w-md mx-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {Math.round(progress)}% complété
            </p>
          </div>
          
          <div className="w-20" /> {/* Spacer */}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Inscription Personne Privée
              </h1>
              <p className="text-gray-600 mb-8">
                Rejoins la communauté PEP'S et profite de tous les privilèges
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identité */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    Identité
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Prénom"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                          validationState.firstName === true
                            ? 'border-emerald-500 bg-emerald-50'
                            : validationState.firstName === false
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 focus:border-emerald-500'
                        }`}
                      />
                      {validationState.firstName && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 animate-scale-in" />
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Nom"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                          validationState.lastName === true
                            ? 'border-emerald-500 bg-emerald-50'
                            : validationState.lastName === false
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 focus:border-emerald-500'
                        }`}
                      />
                      {validationState.lastName && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 animate-scale-in" />
                      )}
                    </div>
                  </div>

                  {/* Sexe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sexe</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Masculin', 'Féminin', 'Autre'].map((gender) => (
                        <button
                          key={gender}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, gender }));
                            validateField('gender', gender);
                          }}
                          className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 font-medium ${
                            formData.gender === gender
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 hover:border-emerald-300 text-gray-700'
                          }`}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date de naissance */}
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.birthDate === true
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Coordonnées
                  </h3>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="address"
                      placeholder="Adresse complète (rue, NPA, ville, pays)"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.address === true
                          ? 'border-emerald-500 bg-emerald-50'
                          : validationState.address === false
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-emerald-500'
                      }`}
                    />
                    {validationState.address && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 animate-scale-in" />
                    )}
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.email === true
                          ? 'border-emerald-500 bg-emerald-50'
                          : validationState.email === false
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-emerald-500'
                      }`}
                    />
                    {validationState.email && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 animate-scale-in" />
                    )}
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="mobile"
                      placeholder="Numéro de mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none ${
                        validationState.mobile === true
                          ? 'border-emerald-500 bg-emerald-50'
                          : validationState.mobile === false
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-emerald-500'
                      }`}
                    />
                    {validationState.mobile && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 animate-scale-in" />
                    )}
                  </div>
                </div>

                {/* Bouton de soumission */}
                <button
                  type="submit"
                  disabled={progress < 100}
                  className={`w-full py-4 rounded-xl font-semibold text-white text-lg transition-all duration-300 ${
                    progress === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-xl hover:scale-105'
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
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-3xl shadow-xl p-6 border-2 transition-all duration-300 ${
                    formData.package === pkg.id
                      ? 'border-emerald-500 shadow-emerald-200'
                      : 'border-transparent'
                  }`}
                >
                  {pkg.popular && (
                    <div className="inline-block px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-full mb-4">
                      Recommandé
                    </div>
                  )}

                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold text-emerald-600">
                      {pkg.price}
                    </span>
                    <span className="text-2xl text-gray-600">{currency}</span>
                    <span className="text-gray-500">/ an</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Indicateur de pays/monnaie */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Pays détecté :</span>
                      <span className="font-semibold">{country === 'CH' ? '🇨🇭 Suisse' : '🇪🇺 UE'}</span>
                    </div>
                  </div>
                </div>
              ))}
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
      `}</style>
    </div>
  );
};

export default RegisterIndividual;
