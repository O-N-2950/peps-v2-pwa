import React, { useState, useRef } from 'react'; // Import de useRef

/**
 * Widget Flottant Pepi - Assistant IA
 * 
 * Affiche Pepi en bas à droite de toutes les pages
 * Clique pour ouvrir le chatbot IA Gemini Flash
 */
const PepiWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: Date.now(), // Ajout d'un ID initial
      role: 'assistant',
      content: '👋 Salut ! Je suis Pepi, ton assistant IA.\n\nMa mission ? T\'aider à découvrir les meilleurs privilèges locaux et soutenir l\'économie de ta région grâce à l\'innovation digitale.\n\nComment puis-je t\'aider aujourd\'hui ?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref pour maintenir le focus sur l'input
  const inputRef = useRef(null);
  // Ref pour scroller automatiquement en bas
  const messagesEndRef = useRef(null);

  // Fonction de scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effet pour scroller à chaque nouveau message
  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effet pour mettre le focus lors de l'ouverture
  React.useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);


  const handleSendMessage = async () => {
    const messageToSend = inputMessage.trim(); // Capture la valeur actuelle
    if (!messageToSend) return;

    // 1. Ajouter le message de l'utilisateur
    const userMessage = { id: Date.now(), role: 'user', content: messageToSend };
    
    // Mise à jour de l'état en utilisant la fonction de mise à jour pour garantir l'ordre
    setMessages(prev => [...prev, userMessage]);
    setInputMessage(''); // Vider l'input immédiatement
    setIsLoading(true);

    try {
      // 2. Appel à l'API IA Coach
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai-coach/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NOTE: Vérifier si le token est toujours nécessaire pour le chat public/widget
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          // Utilisation de la valeur capturée
          message: messageToSend, 
          context: 'general'
        })
      });

      let assistantResponse;
      if (response.ok) {
        const data = await response.json();
        assistantResponse = data.response || 'Je suis là pour t\'aider !';
      } else {
        // Tentative de lire le corps de l'erreur si possible
        const errorText = await response.text();
        console.error('Erreur API Pepi:', response.status, errorText);
        assistantResponse = 'Désolé, je n\'ai pas pu traiter ta demande. Réessaie dans un instant.';
      }
      
      // 3. Ajouter la réponse de l'assistant
      setMessages(prev => [...prev, {
        id: Date.now() + 1, // ID unique
        role: 'assistant',
        content: assistantResponse
      }]);

    } catch (error) {
      console.error('Erreur chat Pepi:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Oups ! Une erreur s\'est produite. Vérifie ta connexion.'
      }]);
    } finally {
      setIsLoading(false);
      // Rétablir le focus sur l'input après la réponse
      inputRef.current?.focus(); 
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Widget Flottant */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="relative group focus:outline-none focus:ring-4 focus:ring-teal-500/50 rounded-full" // A11y: Ajout focus style
            aria-label="Ouvrir le chatbot Pepi"
          >
            {/* Vidéo Pepi Idle */}
            <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-gradient-to-br from-teal-400 to-purple-500 p-1">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-full"
                src="/videos/pepi-02-widget-idle-loop.mp4"
                // Performance: S'assurer que la vidéo est légère et optimisée pour le web
              />
            </div>
            
            {/* Badge notification (optionnel) */}
            {/* ... */}
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                💬 Parle à Pepi
              </div>
            </div>
          </button>
        )}

        {/* Chatbot Modal */}
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl w-96 h-[600px] flex flex-col overflow-hidden border-2 border-teal-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-purple-600 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white p-1">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-full"
                    src="/videos/pepi-02-widget-idle-loop.mp4"
                  />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Pepi</h3>
                  <p className="text-teal-100 text-xs">Assistant IA PEP's</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white" // A11y: Ajout focus style
                aria-label="Fermer le chatbot"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id} // Utilisation de l'ID unique
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-teal-500 text-white'
                        : 'bg-white text-gray-800 shadow-md'
                    }`}
                  >
                    {/* Correction: Ajout de break-words pour les chaînes très longues */}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-md">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              {/* Point de référence pour le scroll */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  ref={inputRef} // Association de la ref
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Écris ton message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-teal-500 to-purple-600 text-white rounded-full p-3 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500/50" // A11y: Ajout focus style
                  aria-label="Envoyer le message"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PepiWidget;
