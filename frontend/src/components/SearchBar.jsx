import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SearchBar({ onResults }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Tous', emoji: '🌍' },
    { id: 'Restaurant', label: 'Restaurant', emoji: '🍕' },
    { id: 'Beauté', label: 'Beauté', emoji: '💇' },
    { id: 'Sport', label: 'Sport', emoji: '🏋️' },
    { id: 'Commerce', label: 'Commerce', emoji: '🛍️' }
  ];

  useEffect(() => {
    if (searchQuery.length > 0 || selectedCategory !== 'all') {
      const timer = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      onResults([]);
    }
  }, [searchQuery, selectedCategory]);

  const performSearch = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      
      const res = await fetch(`/api/partners/search?${params}`);
      const data = await res.json();
      onResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur recherche:', err);
      toast.error('Erreur de recherche');
      onResults([]);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    onResults([]);
  };

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-lg overflow-hidden shadow-sm">
          <Search className="ml-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un partenaire, une ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 text-black outline-none"
          />
          {(searchQuery || selectedCategory !== 'all') && (
            <button onClick={clearSearch} className="p-2 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          )}
          {searching && (
            <div className="p-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#3D9A9A]"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Filtres catégories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-white text-[#3D9A9A] font-bold shadow-md'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
