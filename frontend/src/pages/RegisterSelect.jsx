import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, ArrowRight } from 'lucide-react';

const RegisterSelect = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const profiles = [
    {
      id: 'individual',
      title: 'Personne Privée',
      subtitle: 'Profite des privilèges exclusifs',
      icon: User,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
      path: '/register/individual',
      features: [
        '✨ Accès à tous les privilèges',
        '🗺️ Carte interactive des partenaires',
        '💰 Économies garanties',
        '📱 Application mobile PWA'
      ]
    },
    {
      id: 'company',
      title: 'Entreprise',
      subtitle: 'Offre PEP\'S à tes équipes',
      icon: Building2,
      color: 'teal',
      gradient: 'from-teal-500 to-cyan-500',
      path: '/register/company',
      features: [
        '👥 1 à 5000 accès',
        '📊 Tableau de bord entreprise',
        '💼 Avantage social pour tes employés',
        '🎯 Fidélisation des équipes'
      ]
    }
  ];

  const handleSelect = (path) => {
    // Effet glitch avant la navigation
    document.body.style.animation = 'glitch 0.3s ease-out';
    setTimeout(() => {
      document.body.style.animation = '';
      navigate(path);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Particules flottantes en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Rejoins PEP'S
          </h1>
          <p className="text-xl text-gray-600">
            Choisis ton profil pour commencer
          </p>
        </div>

        {/* Cartes de sélection */}
        <div className="grid md:grid-cols-2 gap-8">
          {profiles.map((profile, index) => {
            const Icon = profile.icon;
            const isHovered = hoveredCard === profile.id;

            return (
              <div
                key={profile.id}
                className={`
                  relative group cursor-pointer
                  transform transition-all duration-500 ease-out
                  ${isHovered ? 'scale-105 -translate-y-2' : 'scale-100'}
                  animate-slide-in
                `}
                style={{ animationDelay: `${index * 0.2}s` }}
                onMouseEnter={() => setHoveredCard(profile.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleSelect(profile.path)}
              >
                {/* Carte */}
                <div className={`
                  relative bg-white rounded-3xl p-8 h-full
                  shadow-lg hover:shadow-2xl transition-shadow duration-500
                  border-2 border-transparent
                  ${isHovered ? `border-${profile.color}-500` : ''}
                  overflow-hidden
                `}>
                  {/* Gradient de fond animé */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br ${profile.gradient} opacity-0
                    group-hover:opacity-10 transition-opacity duration-500
                  `} />

                  {/* Icône avec animation 3D */}
                  <div className="relative mb-6">
                    <div className={`
                      w-20 h-20 rounded-2xl bg-gradient-to-br ${profile.gradient}
                      flex items-center justify-center
                      transform transition-all duration-500
                      ${isHovered ? 'rotate-12 scale-110' : 'rotate-0 scale-100'}
                      shadow-lg
                    `}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="relative">
                    <h2 className="text-3xl font-bold mb-2 text-gray-800">
                      {profile.title}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {profile.subtitle}
                    </p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {profile.features.map((feature, i) => (
                        <li
                          key={i}
                          className={`
                            flex items-center text-gray-700
                            transform transition-all duration-300
                            ${isHovered ? 'translate-x-2' : 'translate-x-0'}
                          `}
                          style={{ transitionDelay: `${i * 50}ms` }}
                        >
                          <span className="text-lg">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Bouton CTA */}
                    <div className={`
                      flex items-center justify-between
                      px-6 py-4 rounded-xl
                      bg-gradient-to-r ${profile.gradient}
                      text-white font-semibold
                      transform transition-all duration-300
                      ${isHovered ? 'scale-105' : 'scale-100'}
                    `}>
                      <span>Commencer</span>
                      <ArrowRight className={`
                        w-5 h-5 transition-transform duration-300
                        ${isHovered ? 'translate-x-2' : 'translate-x-0'}
                      `} />
                    </div>
                  </div>

                  {/* Effet de brillance au hover */}
                  <div className={`
                    absolute top-0 left-0 w-full h-full
                    bg-gradient-to-r from-transparent via-white to-transparent
                    opacity-0 group-hover:opacity-20
                    transform -skew-x-12 -translate-x-full
                    group-hover:translate-x-full
                    transition-transform duration-1000
                    pointer-events-none
                  `} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-gray-600">
            Déjà un compte ?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes glitch {
          0%, 100% {
            transform: translate(0);
            filter: hue-rotate(0deg);
          }
          20% {
            transform: translate(-2px, 2px);
            filter: hue-rotate(90deg);
          }
          40% {
            transform: translate(2px, -2px);
            filter: hue-rotate(180deg);
          }
          60% {
            transform: translate(-2px, -2px);
            filter: hue-rotate(270deg);
          }
          80% {
            transform: translate(2px, 2px);
            filter: hue-rotate(360deg);
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in {
          animation: slide-in 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default RegisterSelect;
