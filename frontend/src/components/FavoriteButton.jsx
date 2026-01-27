import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FavoriteButton = ({ partnerId, partnerName }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfFavorite();
  }, [partnerId]);

  const checkIfFavorite = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/member/favorites', {
        headers: { Authorization: `Bearer \${token}` }
      });

      if (response.data.success) {
        const favoriteIds = response.data.favorites.map(f => f.id);
        setIsFavorite(favoriteIds.includes(partnerId));
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des favoris:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Vous devez être connecté pour ajouter des favoris');
        return;
      }

      if (isFavorite) {
        await axios.delete(`/api/member/favorites/\${partnerId}`, {
          headers: { Authorization: `Bearer \${token}` }
        });
        setIsFavorite(false);
      } else {
        await axios.post('/api/member/favorites', 
          { partner_id: partnerId },
          { headers: { Authorization: `Bearer \${token}` } }
        );
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      style={{
        background: isFavorite ? 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)' : '#fff',
        color: isFavorite ? '#fff' : '#333',
        border: isFavorite ? 'none' : '2px solid #ddd',
        padding: '10px 20px',
        borderRadius: '25px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease',
        boxShadow: isFavorite ? '0 4px 15px rgba(255,107,107,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
        transform: loading ? 'scale(0.95)' : 'scale(1)'
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = isFavorite ? '0 6px 20px rgba(255,107,107,0.5)' : '0 4px 12px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = isFavorite ? '0 4px 15px rgba(255,107,107,0.4)' : '0 2px 8px rgba(0,0,0,0.1)';
        }
      }}
    >
      <span style={{ fontSize: '20px' }}>
        {loading ? '⏳' : (isFavorite ? '❤️' : '🤍')}
      </span>
      <span>{isFavorite ? 'Favori' : 'Ajouter'}</span>
    </button>
  );
};

export default FavoriteButton;
