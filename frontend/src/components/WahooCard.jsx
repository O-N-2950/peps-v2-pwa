import React, { useState } from 'react';
import { motion } from 'framer-motion';
import BookingWizard from './BookingWizard';

export default function WahooCard({ offer, onReserve }) {
  const [showBooking, setShowBooking] = useState(false);

  return (
    <>
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-4 border border-gray-100 relative">
        <div className="h-40 relative">
          <img src={offer.partner.img} className="w-full h-full object-cover" alt="" />
          <div className="absolute bottom-3 left-3 text-white">
              <h3 className="font-bold text-lg leading-none">{offer.partner.name}</h3>
          </div>
        </div>
        <div className="p-4 flex gap-2 items-center">
          <div className="flex-1">
            <h4 className="font-bold text-gray-800">{offer.title}</h4>
          </div>
          
          {offer.partner.booking ? (
              <button onClick={()=>setShowBooking(true)} className="bg-white border-2 border-black text-black px-4 py-2 rounded-xl font-bold text-xs hover:bg-gray-100 transition">
                  RÉSERVER
              </button>
          ) : (
              <button onClick={()=>onReserve(offer)} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg">
                  OFFRE
              </button>
          )}
        </div>
      </div>
      
      {showBooking && <BookingWizard partner={offer.partner} onClose={()=>setShowBooking(false)} />}
    </>
  );
}
