import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function BookingWizard({ partner, onClose }) {
  const [step, setStep] = useState(1); // 1:Service, 2:Date, 3:Confirm
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch(`/api/partner/${partner.id}/services`).then(r=>r.json()).then(setServices);
  }, [partner.id]);

  useEffect(() => {
    if(selectedService && date) {
      setLoading(true);
      fetch(`/api/partner/${partner.id}/slots?date=${date}&service_id=${selectedService.id}`)
        .then(r=>r.json())
        .then(d => { setSlots(d); setLoading(false); });
    }
  }, [date, selectedService]);

  const confirmBooking = async () => {
    const token = localStorage.getItem('token');
    if(!token) return alert("Veuillez vous connecter (compte gratuit) pour réserver !");

    const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({
            partner_id: partner.id,
            service_id: selectedService.id,
            date: date,
            time: selectedSlot
        })
    });
    const data = await res.json();
    if(data.success) setResult(data);
    else alert(data.error);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col animate-slide-up">
        
        <div className="bg-peps-turquoise p-4 text-white flex justify-between items-center">
            <h2 className="font-black text-lg">Réserver : {partner.name}</h2>
            <button onClick={onClose}><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto">
            {result ? (
                <div className="text-center py-8">
                    <CheckCircle size={64} className="text-green-500 mx-auto mb-4"/>
                    <h3 className="text-2xl font-black mb-2">Confirmé !</h3>
                    <p className="text-gray-500 mb-6">{result.msg}</p>
                    
                    {result.privilege ? (
                        <div className="bg-peps-turquoise/10 text-peps-turquoise p-4 rounded-xl font-bold border border-peps-turquoise flex items-center gap-2 justify-center">
                            ✨ {result.details}
                        </div>
                    ) : (
                        <div className="bg-gray-100 text-gray-500 p-4 rounded-xl text-sm border">
                            Réservation Standard
                            <div className="text-xs mt-1 text-peps-pink font-bold">Passez Membre Actif pour -20% !</div>
                        </div>
                    )}
                    <button onClick={onClose} className="mt-6 w-full bg-black text-white py-3 rounded-xl font-bold">Terminer</button>
                </div>
            ) : (
                <>
                {step === 1 && (
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-gray-400 uppercase">Choisir une prestation</p>
                        {services.map(s => (
                            <div key={s.id} onClick={()=>{setSelectedService(s); setStep(2)}} 
                                 className="border p-4 rounded-xl hover:border-peps-turquoise cursor-pointer flex justify-between items-center bg-gray-50 hover:bg-white transition">
                                <div>
                                    <div className="font-bold">{s.name}</div>
                                    <div className="text-xs text-gray-400">{s.duration} min</div>
                                </div>
                                <div className="font-black">{s.price} CHF</div>
                            </div>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <button onClick={()=>setStep(1)} className="text-xs text-gray-400 mb-4">← Retour</button>
                        <input type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={e=>setDate(e.target.value)} className="w-full p-3 border rounded-xl mb-4 font-bold"/>
                        
                        {loading ? <div className="text-center py-4 text-gray-400">Chargement...</div> : (
                            <div className="grid grid-cols-4 gap-2">
                                {slots.map(slot => (
                                    <button key={slot} onClick={()=>{setSelectedSlot(slot); setStep(3)}} 
                                            className="py-2 bg-gray-100 rounded-lg text-sm font-bold hover:bg-black hover:text-white transition">
                                        {slot}
                                    </button>
                                ))}
                                {slots.length === 0 && <div className="col-span-4 text-center text-red-400 text-xs py-2">Aucun créneau.</div>}
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <button onClick={()=>setStep(2)} className="text-xs text-gray-400 mb-4">← Retour</button>
                        <div className="bg-gray-50 p-4 rounded-xl mb-6 border space-y-1">
                            <div className="flex justify-between font-bold"><span>{selectedService.name}</span><span>{selectedService.price} CHF</span></div>
                            <div className="flex justify-between text-sm text-gray-500"><span>{date}</span><span>{selectedSlot}</span></div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-6 flex gap-2">
                            <AlertTriangle size={16} className="shrink-0"/>
                            <p>Paiement sur place. Votre statut de membre sera vérifié lors du paiement pour appliquer le privilège.</p>
                        </div>

                        <button onClick={confirmBooking} className="w-full bg-peps-turquoise text-white py-4 rounded-xl font-black text-lg shadow-xl">
                            VALIDER LE RDV
                        </button>
                    </div>
                )}
                </>
            )}
        </div>
      </div>
    </div>
  );
}