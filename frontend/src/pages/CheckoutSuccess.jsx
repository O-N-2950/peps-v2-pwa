/**
 * Page de confirmation après paiement réussi
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './CheckoutSuccess.css';

function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  
  useEffect(() => {
    verifyPayment();
  }, []);
  
  const verifyPayment = async () => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('Session invalide');
      setLoading(false);
      return;
    }
    
    try {
      // Optionnel : Vérifier la session côté serveur
      // Pour l'instant, on fait confiance à Stripe
      
      // Simuler récupération infos abonnement
      setTimeout(() => {
        setSubscription({
          nb_access: 5,
          currency: 'CHF',
          amount: 199.00
        });
        setLoading(false);
      }, 1500);
      
    } catch (err) {
      console.error('Erreur vérification:', err);
      setError('Erreur lors de la vérification du paiement');
      setLoading(false);
    }
  };
  
  const goToDashboard = () => {
    navigate('/member-dashboard');
  };
  
  if (loading) {
    return (
      <div className="checkout-success-page">
        <div className="success-container loading-state">
          <div className="big-spinner"></div>
          <h2>Vérification du paiement...</h2>
          <p>Veuillez patienter</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="checkout-success-page">
        <div className="success-container error-state">
          <div className="error-icon">❌</div>
          <h2>Erreur</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/pricing')} className="btn-secondary">
            Retour à la tarification
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="checkout-success-page">
      <div className="success-container">
        
        {/* Animation succès */}
        <div className="success-animation">
          <div className="checkmark-circle">
            <div className="checkmark"></div>
          </div>
        </div>
        
        {/* Message */}
        <h1 className="success-title">
          🎉 Paiement réussi !
        </h1>
        
        <p className="success-message">
          Bienvenue chez PEP's ! Votre abonnement est maintenant actif.
        </p>
        
        {/* Détails abonnement */}
        {subscription && (
          <div className="subscription-summary">
            <h3>Récapitulatif de votre abonnement</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Nombre d'accès :</span>
                <strong className="summary-value">{subscription.nb_access}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Montant payé :</span>
                <strong className="summary-value">
                  {subscription.amount.toFixed(2)} {subscription.currency}
                </strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Période :</span>
                <strong className="summary-value">1 an</strong>
              </div>
            </div>
          </div>
        )}
        
        {/* Prochaines étapes */}
        <div className="next-steps">
          <h3>🚀 Prochaines étapes</h3>
          <ol className="steps-list">
            <li>
              <span className="step-number">1</span>
              <div className="step-content">
                <strong>Complétez votre profil</strong>
                <p>Ajoutez vos préférences pour des recommandations personnalisées</p>
              </div>
            </li>
            <li>
              <span className="step-number">2</span>
              <div className="step-content">
                <strong>Explorez la carte des partenaires</strong>
                <p>Découvrez les commerces locaux près de chez vous</p>
              </div>
            </li>
            <li>
              <span className="step-number">3</span>
              <div className="step-content">
                <strong>Profitez de vos privilèges</strong>
                <p>Présentez votre carte membre et économisez !</p>
              </div>
            </li>
            {subscription?.nb_access > 1 && (
              <li>
                <span className="step-number">4</span>
                <div className="step-content">
                  <strong>Invitez vos proches</strong>
                  <p>
                    Vous avez {subscription.nb_access - 1} invitation{subscription.nb_access > 2 ? 's' : ''} disponible{subscription.nb_access > 2 ? 's' : ''}
                  </p>
                </div>
              </li>
            )}
          </ol>
        </div>
        
        {/* Email confirmation */}
        <div className="email-notice">
          <span className="email-icon">📧</span>
          <p>
            Un email de confirmation vous a été envoyé avec tous les détails de votre abonnement.
          </p>
        </div>
        
        {/* Bouton action */}
        <button onClick={goToDashboard} className="btn-dashboard">
          Accéder à mon tableau de bord
        </button>
        
        {/* Support */}
        <div className="support-links">
          <p>Besoin d'aide ?</p>
          <a href="mailto:support@peps.digital">support@peps.digital</a>
          <span className="separator">•</span>
          <a href="/faq">FAQ</a>
        </div>
        
      </div>
    </div>
  );
}

export default CheckoutSuccess;
