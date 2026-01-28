/**
 * Hook pour le Haptic Feedback (vibrations tactiles)
 * Donne une sensation native au clic des boutons
 */

export const useHaptics = () => {
  const isSupported = 'vibrate' in navigator;
  
  const haptics = {
    // Vibration légère (10ms) - Pour les clics standards
    light: () => {
      if (isSupported) {
        navigator.vibrate(10);
      }
    },
    
    // Vibration moyenne (50ms) - Pour les actions importantes
    medium: () => {
      if (isSupported) {
        navigator.vibrate(50);
      }
    },
    
    // Vibration forte (100ms) - Pour les actions critiques
    heavy: () => {
      if (isSupported) {
        navigator.vibrate(100);
      }
    },
    
    // Pattern de succès (double impulsion) - Pour les confirmations
    success: () => {
      if (isSupported) {
        navigator.vibrate([50, 30, 50]);
      }
    },
    
    // Pattern d'erreur (triple impulsion) - Pour les erreurs
    error: () => {
      if (isSupported) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
    },
    
    // Pattern de notification - Pour les alertes
    notification: () => {
      if (isSupported) {
        navigator.vibrate([30, 50, 30]);
      }
    }
  };
  
  return haptics;
};

/**
 * UTILISATION :
 * 
 * import { useHaptics } from '../hooks/useHaptics';
 * 
 * const haptics = useHaptics();
 * 
 * <button 
 *   onClick={() => {
 *     haptics.light();  // Vibration au clic
 *     // ... votre logique
 *   }}
 * >
 *   Confirmer
 * </button>
 * 
 * TYPES DE VIBRATIONS :
 * - light() : Clic standard (10ms)
 * - medium() : Action importante (50ms)
 * - heavy() : Action critique (100ms)
 * - success() : Confirmation réussie (double impulsion)
 * - error() : Erreur (triple impulsion)
 * - notification() : Alerte (pattern court)
 * 
 * COMPATIBILITÉ :
 * - ✅ Android Chrome
 * - ⚠️ iOS Safari (limité, nécessite interaction utilisateur)
 * - ✅ Android Firefox
 * - ❌ Desktop (pas de vibration)
 */
