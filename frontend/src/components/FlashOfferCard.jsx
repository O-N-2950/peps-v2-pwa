import React, { useState } from 'react';
import axios from 'axios';

const FlashOfferCard = ({ offer, onReserve }) => {
  const [loading, setLoading] = useState(false);
  const [reserved, setReserved] = useState(false);

  const handleReserve = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Vous devez être connecté pour réserver une offre flash');
        return;
      }

      const response = await axios.post(
        \`/api/member/offers/flash/\${offer.id}/reserve\`,
        {},
        { headers: { Authorization: \`Bearer \${token}\` } }
      );

      if (response.data.success) {
        setReserved(true);
        alert(\`✅ \${response.data.message}\`);
        if (onReserve) onReserve(offer.id);
      }
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      alert(error.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = () => {
    const end = new Date(offer.validity_end);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return 'Expiré';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return \`\${hours}h \${minutes}min\`;
    return \`\${minutes}min\`;
  };

  const stockPercentage = (offer.current_stock / offer.total_stock) * 100;
  const isLowStock = stockPercentage < 30;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '20px',
      padding: '24px',
      color: '#fff',
      boxShadow: '0 10px 30px rgba(102,126,234,0.3)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 15px 40px rgba(102,126,234,0.4)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 10px 30px rgba(102,126,234,0.3)';
    }}
    >
      {/* Badge Flash */}
      <div style={{
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: '#ff6b6b',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        animation: 'pulse 2s infinite'
      }}>
        ⚡ FLASH
      </div>

      {/* Partenaire */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
          {offer.partner.name}
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          📍 {offer.partner.city} • {offer.partner.category}
        </p>
      </div>

      {/* Offre */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '28px', 
          fontWeight: '800',
          background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {offer.value}
        </h2>
        <p style={{ margin: '8px 0 0 0', fontSize: '16px', lineHeight: '1.5' }}>
          {offer.title}
        </p>
        {offer.description && (
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            {offer.description}
          </p>
        )}
      </div>

      {/* Stock */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>
            {offer.current_stock} / {offer.total_stock} disponibles
          </span>
          {isLowStock && (
            <span style={{ 
              fontSize: '12px', 
              background: '#ff6b6b', 
              padding: '4px 8px', 
              borderRadius: '10px',
              fontWeight: '700'
            }}>
              🔥 Dernières places !
            </span>
          )}
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: \`\${stockPercentage}%\`,
            height: '100%',
            background: isLowStock ? '#ff6b6b' : '#4ade80',
            transition: 'width 0.5s ease',
            borderRadius: '10px'
          }} />
        </div>
      </div>

      {/* Temps restant */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        padding: '10px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '10px'
      }}>
        <span style={{ fontSize: '18px' }}>⏰</span>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>
          Expire dans {getTimeRemaining()}
        </span>
      </div>

      {/* Bouton Réserver */}
      <button
        onClick={handleReserve}
        disabled={loading || reserved || offer.current_stock === 0}
        style={{
          width: '100%',
          padding: '14px',
          background: reserved ? '#4ade80' : (loading || offer.current_stock === 0) ? '#999' : '#fff',
          color: reserved ? '#fff' : '#667eea',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '700',
          cursor: (loading || reserved || offer.current_stock === 0) ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}
        onMouseEnter={(e) => {
          if (!loading && !reserved && offer.current_stock > 0) {
            e.target.style.transform = 'scale(1.02)';
            e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && !reserved && offer.current_stock > 0) {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
          }
        }}
      >
        {loading ? '⏳ Réservation...' : reserved ? '✅ Réservé !' : offer.current_stock === 0 ? '❌ Complet' : '🎯 Réserver maintenant'}
      </button>
    </div>
  );
};

export default FlashOfferCard;
