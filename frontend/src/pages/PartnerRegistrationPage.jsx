import React from 'react';
import PartnerRegistrationFormNew from '../components/PartnerRegistrationFormNew';
import ErrorBoundary from '../components/ErrorBoundary';

/**
 * Page d'inscription pour les partenaires (Commerce/Association/Artisan)
 * Accessible via /register/partner
 */
const PartnerRegistrationPage = () => {
  return (
    <ErrorBoundary>
      <PartnerRegistrationFormNew />
    </ErrorBoundary>
  );
};

export default PartnerRegistrationPage;
