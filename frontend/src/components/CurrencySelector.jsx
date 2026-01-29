import React, { useState, useEffect } from 'react';
import './CurrencySelector.css';

function CurrencySelector({ value, onChange }) {
  const [detectedCurrency, setDetectedCurrency] = useState(null);
  const [isDetecting, setIsDetecting] = useState(true);
  
  useEffect(() => {
    detectCurrency();
  }, []);
  
  const detectCurrency = async () => {
    try {
      const response = await fetch('/api/pricing/detect-currency');
      const data = await response.json();
      
      setDetectedCurrency(data);
      setIsDetecting(false);
      
      // Si pas de valeur déjà définie, utiliser détection
      if (!value) {
        onChange(data.currency);
      }
    } catch (err) {
      console.error('Erreur détection devise:', err);
      setIsDetecting(false);
      // Fallback CHF
      if (!value) {
        onChange('CHF');
      }
    }
  };
  
  const currencies = [
    { code: 'CHF', flag: '🇨🇭', name: 'Suisse', symbol: 'CHF' },
    { code: 'EUR', flag: '🇪🇺', name: 'Europe', symbol: '€' }
  ];
  
  const currentCurrency = currencies.find(c => c.code === value);
  const otherCurrency = currencies.find(c => c.code !== value);
  
  return (
    <div className="currency-selector">
      {isDetecting ? (
        <div className="detecting">
          <span className="spinner">⏳</span>
          Détection de votre devise...
        </div>
      ) : (
        <>
          <div className="current-currency">
            <span className="flag">{currentCurrency?.flag}</span>
            <span className="currency-name">
              Devise : <strong>{currentCurrency?.code}</strong>
            </span>
            
            {detectedCurrency?.detected && value === detectedCurrency.currency && (
              <span className="auto-tag">
                ✓ Détectée automatiquement
              </span>
            )}
          </div>
          
          <button
            className="change-currency-btn"
            onClick={() => onChange(otherCurrency.code)}
          >
            {otherCurrency?.flag} Changer en {otherCurrency?.code}
          </button>
        </>
      )}
    </div>
  );
}

export default CurrencySelector;
