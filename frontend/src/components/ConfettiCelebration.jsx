import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

/**
 * Composant d'animation confetti pour célébrer le déclenchement d'un privilège
 * Fait exploser des étoiles multicolores à l'écran
 */
const ConfettiCelebration = ({ trigger = false, onComplete }) => {
  useEffect(() => {
    if (trigger) {
      // Configuration des couleurs PEP'S + multicolores
      const colors = [
        '#2A9D8F', // Turquoise PEP'S
        '#E76F51', // Corail PEP'S
        '#F4A261', // Orange
        '#E9C46A', // Jaune
        '#FF6B9D', // Rose
        '#C77DFF', // Violet
        '#4CC9F0', // Bleu ciel
        '#06FFA5', // Vert menthe
      ];

      // Animation 1 : Explosion centrale
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { x: 0.5, y: 0.5 },
        colors: colors,
        shapes: ['star', 'circle'],
        scalar: 1.2,
        gravity: 0.8,
        ticks: 300,
      });

      // Animation 2 : Explosion gauche (délai 200ms)
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.6 },
          colors: colors,
          shapes: ['star'],
          scalar: 1,
        });
      }, 200);

      // Animation 3 : Explosion droite (délai 400ms)
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.6 },
          colors: colors,
          shapes: ['star'],
          scalar: 1,
        });
      }, 400);

      // Animation 4 : Pluie d'étoiles (délai 600ms)
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 180,
          origin: { x: 0.5, y: 0 },
          colors: colors,
          shapes: ['star'],
          scalar: 0.8,
          gravity: 1.2,
          ticks: 400,
        });
      }, 600);

      // Callback de fin d'animation (après 2 secondes)
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    }
  }, [trigger, onComplete]);

  return null; // Composant invisible, juste pour l'animation
};

export default ConfettiCelebration;
