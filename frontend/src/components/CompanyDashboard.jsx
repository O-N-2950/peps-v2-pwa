import React from 'react';
import GroupManager from './GroupManager';

export default function CompanyDashboard() {
  return (
    <div className="bg-gray-50 min-h-screen p-4 pb-24">
        <h1 className="font-black text-xl text-[#3D9A9A] mb-4">Espace Entreprise</h1>
        <GroupManager />
    </div>
  );
}
