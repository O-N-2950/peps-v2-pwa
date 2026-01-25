import React from 'react';
import { PartnerRegistrationForm } from '../components/MemberRegistrationForm';

/**
 * Page d'inscription pour les partenaires
 * Accessible via /register/partner
 */
const PartnerRegistrationPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A9D8F]/10 to-[#E76F51]/10 py-12">
      <div className="container mx-auto px-4">
        <PartnerRegistrationForm />
      </div>
    </div>
  );
};

export default PartnerRegistrationPage;
