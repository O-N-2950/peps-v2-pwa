import React, { useState, useEffect } from 'react';
import { X, Home, Share, MoreVertical } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    const Android = /android/.test(userAgent);
    
    setIsIOS(iOS);
    setIsAndroid(Android);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const visits = parseInt(localStorage.getItem('peps_visit_count') || '0') + 1;
    localStorage.setItem('peps_visit_count', visits.toString());
    const dismissed = localStorage.getItem('peps_pwa_dismissed');
    
    if (visits >= 3 && !isStandalone && !dismissed && (iOS || Android)) {
      setTimeout(() => setShowPrompt(true), 2000);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('peps_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={handleDismiss} />
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white rounded-t-3xl shadow-2xl max-w-2xl mx-auto p-6">
          <button onClick={handleDismiss} className="absolute top-4 right-4 p-2">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#3D9A9A] rounded-2xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold">Ajoutez l'app à votre écran d'accueil !</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Accédez-y instantanément, sans téléchargement.
          </p>

          {isIOS && (
            <div className="bg-blue-50 rounded-2xl p-4 space-y-2 mb-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-blue-500 rounded-full text-white text-sm flex items-center justify-center">1</span>
                <p className="text-sm">Appuyez sur <Share className="inline w-4 h-4" /> <strong>Partager</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-blue-500 rounded-full text-white text-sm flex items-center justify-center">2</span>
                <p className="text-sm">Sélectionnez <strong>"Sur l'écran d'accueil"</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-blue-500 rounded-full text-white text-sm flex items-center justify-center">3</span>
                <p className="text-sm">Appuyez sur <strong>"Ajouter"</strong></p>
              </div>
            </div>
          )}

          {isAndroid && (
            <div className="bg-green-50 rounded-2xl p-4 space-y-2 mb-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-green-500 rounded-full text-white text-sm flex items-center justify-center">1</span>
                <p className="text-sm">Appuyez sur <MoreVertical className="inline w-4 h-4" /> <strong>Menu</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-green-500 rounded-full text-white text-sm flex items-center justify-center">2</span>
                <p className="text-sm">Sélectionnez <strong>"Installer l'application"</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-green-500 rounded-full text-white text-sm flex items-center justify-center">3</span>
                <p className="text-sm">Confirmez</p>
              </div>
            </div>
          )}

          <button onClick={handleDismiss} className="w-full bg-[#3D9A9A] text-white py-3 rounded-xl font-bold">
            J'ai compris !
          </button>
        </div>
      </div>
    </>
  );
}
