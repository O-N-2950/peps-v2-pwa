import React, { createContext, useState, useEffect, useContext } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('CHF');

  useEffect(() => {
    const saved = localStorage.getItem('peps_currency');
    if (saved) setCurrency(saved);
    else fetch('/api/currency/detect').then(r=>r.json()).then(d => setCurrency(d.currency));
  }, []);

  const switchCurrency = (c) => {
    setCurrency(c);
    localStorage.setItem('peps_currency', c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, switchCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
