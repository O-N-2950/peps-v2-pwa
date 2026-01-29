/**
 * Page d'annulation de paiement
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CheckoutCancel.css';

function CheckoutCancel() {
  const navigate = useNavigate();
  
  const retryPayment = () => {
    navigate('/pricing');
  };
  
  const goHome = () => {
    navigate('/');
  };
  
  return (
    <div className="checkout-cancel-page">
      <div className="cancel-container">
        
        {/* Icône */}
        <div className="cancel-icon">
          <div className="icon-circle">
            ⚠️
          </div>
        </div>
        
        {/* Message */}
        <h1 className="cancel-title">
          Paiement annulé
        </h1>
        
        <p className="cancel-message">
          Votre paiement n'a pas été effectué. Aucun montant n'a été débité de votre compte.
        </p>
        
        {/* Raisons possibles */}
        <div className="reasons-box">
          <h3>Pourquoi le paiement a-t-il été annulé ?</h3>
          <ul>
            <li>Vous avez cliqué sur le bouton "Retour"</li>
            <li>Vous avez fermé la fenêtre de paiement</li>
            <li>La session a expiré</li>
            <li>Vous avez changé d'avis</li>
          </ul>
        </div>
        
        {/* Que faire maintenant */}
        <div className="next-actions">
          <h3>Que souhaitez-vous faire ?</h3>
          
          <button onClick={retryPayment} className="btn-retry">
            <span>💳</span>
            <span>Réessayer le paiement</span>
          </button>
          
          <button onClick={goHome} className="btn-home">
            <span>🏠</span>
            <span>Retour à l'accueil</span>
          </button>
        </div>
        
        {/* Aide */}
        <div className="help-section">
          <p className="help-title">Besoin d'aide ?</p>
          <p className="help-text">
            Si vous rencontrez un problème avec le paiement, notre équipe est là pour vous aider.
          </p>
          <div className="help-links">
            <a href="mailto:support@peps.digital" className="help-link">
              📧 support@peps.digital
            </a>
            <a href="/faq" className="help-link">
              ❓ Voir la FAQ
            </a>
          </div>
        </div>
        
        {/* Rassurance */}
        <div className="reassurance">
          <p>
            <strong>🔒 Paiement 100% sécurisé</strong> - Vos données bancaires sont protégées par Stripe, leader mondial du paiement en ligne.
          </p>
        </div>
        
      </div>
    </div>
  );
}

export default CheckoutCancel;
