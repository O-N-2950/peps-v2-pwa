import React, { useState, useEffect } from 'react';
import CurrencySelector from '../components/CurrencySelector';
import './Pricing.css';

function Pricing() {
  const [nbAccess, setNbAccess] = useState(1);
  const [currency, setCurrency] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Recalculer quand nb ou devise change
  useEffect(() => {
    if (currency) {
      calculatePrice();
    }
  }, [nbAccess, currency]);
  
  const calculatePrice = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nb_access: nbAccess,
          currency: currency 
        })
      });
      
      const data = await response.json();
      setPricing(data);
    } catch (err) {
      console.error('Erreur calcul prix:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckout = async () => {
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nb_access: nbAccess,
          currency: currency
        })
      });
      
      const data = await response.json();
      
      // Rediriger vers Stripe Checkout
      window.location.href = data.checkout_url;
      
    } catch (err) {
      console.error('Erreur checkout:', err);
      alert('Erreur lors de la création de la session de paiement');
    }
  };
  
  return (
    <div className="pricing-page">
      <div className="pricing-container">
        
        <h1>Abonnement PEP's</h1>
        <p className="subtitle">
          Accédez aux privilèges exclusifs chez nos partenaires locaux
        </p>
        
        {/* Sélecteur devise */}
        <CurrencySelector 
          value={currency}
          onChange={setCurrency}
        />
        
        {/* Nombre d'accès */}
        <div className="access-input">
          <label>
            <span className="label-text">Nombre d'accès</span>
            <span className="label-helper">
              Pour combien de personnes ?
            </span>
          </label>
          
          <div className="input-group">
            <button 
              className="decrement"
              onClick={() => setNbAccess(Math.max(1, nbAccess - 1))}
              disabled={nbAccess <= 1}
            >
              −
            </button>
            
            <input
              type="number"
              min="1"
              max="5000"
              value={nbAccess}
              onChange={(e) => setNbAccess(parseInt(e.target.value) || 1)}
            />
            
            <button 
              className="increment"
              onClick={() => setNbAccess(nbAccess + 1)}
            >
              +
            </button>
          </div>
          
          <input
            type="range"
            min="1"
            max="100"
            value={Math.min(nbAccess, 100)}
            onChange={(e) => setNbAccess(parseInt(e.target.value))}
            className="slider"
          />
        </div>
        
        {/* Affichage prix */}
        {loading ? (
          <div className="pricing-loading">
            Calcul en cours...
          </div>
        ) : pricing ? (
          <div className="pricing-display">
            <div className="price-main">
              <span className="amount">
                {pricing.total_price.toLocaleString('fr-CH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
              <span className="currency">{pricing.currency_symbol}</span>
              <span className="period">/ an</span>
            </div>
            
            <div className="price-details">
              <div className="detail-row">
                <span>Prix par accès :</span>
                <strong>
                  {pricing.price_per_access.toFixed(2)} {pricing.currency_symbol}
                </strong>
              </div>
              
              {pricing.discount_percent > 0 && (
                <div className="detail-row discount">
                  <span>Économie :</span>
                  <strong className="discount-value">
                    -{pricing.discount_percent}%
                  </strong>
                </div>
              )}
              
              <div className="detail-row vat">
                <span>
                  {currency === 'CHF' ? 'TVA suisse incluse' : 'TVA européenne incluse'}
                </span>
              </div>
            </div>
            
            {pricing.tier_type === 'fixed' && pricing.nb_access_included > nbAccess && (
              <div className="tier-notice">
                ℹ️ Palier recommandé : {pricing.nb_access_included} accès
                <br/>
                Vous aurez {pricing.nb_access_included - nbAccess} places supplémentaires
              </div>
            )}
          </div>
        ) : null}
        
        {/* Bouton paiement */}
        <button 
          className="checkout-btn"
          onClick={handleCheckout}
          disabled={!currency || loading}
        >
          Souscrire - Payer en {currency}
        </button>
        
        {/* Avantages */}
        <div className="benefits">
          <h3>✨ Inclus dans votre abonnement</h3>
          <ul>
            <li>✅ Accès illimité aux privilèges partenaires</li>
            <li>✅ Carte interactive des commerces</li>
            <li>✅ Nouveaux partenaires chaque mois</li>
            <li>✅ Économies garanties dès la 1ère utilisation</li>
            <li>✅ Support client réactif</li>
            <li>✅ Annulation possible à tout moment</li>
          </ul>
        </div>
        
      </div>
    </div>
  );
}

export default Pricing;
