import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FlashOfferCard from './FlashOfferCard';

const FlashOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFlashOffers();
  }, []);

  const fetchFlashOffers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Vous devez être connecté pour voir les offres flash');
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/member/offers/flash', {
        headers: { Authorization: \`Bearer \${token}\` }
      });

      if (response.data.success) {
        setOffers(response.data.offers);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des offres flash:', err);
      setError('Impossible de charger les offres flash');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = (offerId) => {
    // Recharger les offres après une réservation
    fetchFlashOffers();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚡</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Chargement des offres flash...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 40px auto', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '800',
          color: '#fff',
          margin: '0 0 16px 0',
          textShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          ⚡ Offres Flash
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#fff',
          opacity: 0.9,
          margin: 0
        }}>
          Profitez des meilleures offres avant qu'elles n'expirent !
        </p>
      </div>

      {/* Liste des offres */}
      {offers.length === 0 ? (
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎁</div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 12px 0' }}>
            Aucune offre flash pour le moment
          </h2>
          <p style={{ fontSize: '18px', color: '#fff', opacity: 0.8, margin: 0 }}>
            Revenez bientôt pour découvrir de nouvelles offres exclusives !
          </p>
        </div>
      ) : (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {offers.map(offer => (
            <FlashOfferCard
              key={offer.id}
              offer={offer}
              onReserve={handleReserve}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashOffers;
