import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AICoachWidget() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/ai-coach/suggestions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Erreur chargement suggestions IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-orange-500 bg-orange-50';
      case 'low':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getActionButtonColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-600 hover:bg-red-700';
      case 'medium':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'low':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  const handleAction = (suggestion) => {
    // TODO: Implémenter les actions selon le type
    toast.success(`Action "${suggestion.action}" en cours...`);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-3xl">🤖</span>
          <h3 className="text-xl font-bold">Votre Coach IA Gemini</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-3xl">🤖</span>
          <h3 className="text-xl font-bold">Votre Coach IA Gemini</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-white/90">✨ Tout est parfait ! Continuez comme ça.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h3 className="text-xl font-bold">Votre Coach IA Gemini</h3>
            <p className="text-sm text-white/80">
              {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} pour vous aujourd'hui
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm transition-colors"
        >
          {expanded ? 'Réduire' : 'Voir tout'}
        </button>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        {(expanded ? suggestions : suggestions.slice(0, 3)).map((suggestion, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg p-4 border-l-4 ${getPriorityColor(suggestion.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{suggestion.icon}</span>
                  <h4 className="font-bold text-gray-900">{suggestion.title}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                <button
                  onClick={() => handleAction(suggestion)}
                  className={`${getActionButtonColor(suggestion.priority)} text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors`}
                >
                  {suggestion.action}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {!expanded && suggestions.length > 3 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Voir toutes les suggestions ({suggestions.length})
        </button>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadSuggestions}
        className="w-full mt-3 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
      >
        <span>🔄</span>
        <span>Actualiser les suggestions</span>
      </button>
    </div>
  );
}
