'use client';

import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';
import styles from './ChatBot.module.scss';

// Réponses prédéfinies du chatbot
const botResponses = {
  greeting: [
    "Bonjour ! Je suis l'assistant GlamGo. Comment puis-je vous aider aujourd'hui ?",
    "Bienvenue sur GlamGo ! Je suis là pour répondre à vos questions.",
    "Salut ! Comment puis-je vous assister ?"
  ],
  services: [
    "Nous proposons une large gamme de services de beauté à domicile : coiffure, maquillage, manucure, soins du visage, massages et bien plus encore ! Consultez notre page Services pour découvrir toutes nos prestations.",
  ],
  booking: [
    "Pour réserver un service, c'est simple :\n1. Choisissez un service dans notre catalogue\n2. Sélectionnez une date et une heure\n3. Confirmez votre adresse\n4. Validez votre réservation\n\nUn prestataire proche de chez vous sera assigné à votre demande !",
  ],
  pricing: [
    "Nos tarifs varient selon le service choisi. Vous pouvez consulter les prix sur chaque fiche service. Les frais de déplacement sont calculés automatiquement en fonction de la distance.",
  ],
  provider: [
    "Vous souhaitez devenir prestataire GlamGo ? Rendez-vous sur notre page d'inscription prestataire pour rejoindre notre équipe de professionnels de la beauté !",
  ],
  payment: [
    "Nous acceptons plusieurs moyens de paiement : carte bancaire, paiement mobile (Wave, Orange Money) et paiement en espèces. Le paiement est sécurisé et effectué après la prestation.",
  ],
  cancel: [
    "Vous pouvez annuler votre réservation jusqu'à 2 heures avant le rendez-vous sans frais. Pour annuler, rendez-vous dans 'Mes commandes' et cliquez sur 'Annuler'.",
  ],
  contact: [
    "Pour nous contacter, vous pouvez :\n- Utiliser ce chat\n- Envoyer un email à support@glamgo.com\n- Nous appeler au +221 XX XXX XX XX\n\nNotre équipe est disponible 7j/7 de 8h à 22h.",
  ],
  default: [
    "Je ne suis pas sûr de comprendre votre demande. Voici ce que je peux vous aider avec :\n\n• Nos services\n• Comment réserver\n• Les tarifs\n• Devenir prestataire\n• Les moyens de paiement\n• Annuler une commande\n• Nous contacter\n\nN'hésitez pas à reformuler votre question !",
  ]
};

// Mots-clés pour détecter l'intention
const intentKeywords = {
  greeting: ['bonjour', 'salut', 'hello', 'hi', 'bonsoir', 'coucou', 'hey'],
  services: ['service', 'prestation', 'proposez', 'offrez', 'catalogue', 'coiffure', 'maquillage', 'manucure', 'massage'],
  booking: ['réserver', 'commander', 'prendre rendez-vous', 'rdv', 'réservation', 'comment faire'],
  pricing: ['prix', 'tarif', 'coût', 'combien', 'cher', 'frais'],
  provider: ['prestataire', 'travailler', 'rejoindre', 'devenir', 'inscription pro'],
  payment: ['payer', 'paiement', 'carte', 'wave', 'orange money', 'espèce'],
  cancel: ['annuler', 'annulation', 'rembourser', 'remboursement'],
  contact: ['contact', 'joindre', 'email', 'téléphone', 'appeler', 'support']
};

// Suggestions rapides
const quickReplies = [
  "Vos services",
  "Comment réserver ?",
  "Les tarifs",
  "Devenir prestataire",
  "Moyens de paiement"
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll automatique vers le dernier message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Message de bienvenue à l'ouverture
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages([{
          id: Date.now(),
          text: getRandomResponse('greeting'),
          sender: 'bot'
        }]);
      }, 1000);
    }
  }, [isOpen, messages.length]);

  // Focus sur l'input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasNewMessage(false);
    }
  }, [isOpen]);

  // Obtenir une réponse aléatoire
  const getRandomResponse = (intent) => {
    const responses = botResponses[intent] || botResponses.default;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Détecter l'intention du message
  const detectIntent = (message) => {
    const lowerMessage = message.toLowerCase();

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }

    return 'default';
  };

  // Envoyer un message
  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: Date.now(),
      text,
      sender: 'user'
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simuler la réponse du bot
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const intent = detectIntent(text);
      const botMessage = {
        id: Date.now() + 1,
        text: getRandomResponse(intent),
        sender: 'bot'
      };
      setMessages(prev => [...prev, botMessage]);

      if (!isOpen) {
        setHasNewMessage(true);
      }
    }, 1000 + Math.random() * 1000);
  };

  // Gérer l'appui sur Entrée
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Gérer les suggestions rapides
  const handleQuickReply = (reply) => {
    setInputValue(reply);
    setTimeout(handleSend, 100);
  };

  // Toggle le panel
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.chatbotWidget}>
      {/* Panel du chat */}
      {isOpen && (
        <div className={styles.chatbotPanel}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderInfo}>
              <div className={styles.chatAvatar}>
                <FaRobot />
              </div>
              <div className={styles.chatHeaderText}>
                <h3>Assistant GlamGo</h3>
                <p>En ligne</p>
              </div>
            </div>
            <button className={styles.closeButton} onClick={toggleChat}>
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${styles[message.sender]}`}
              >
                {message.text.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < message.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            ))}

            {/* Indicateur de frappe */}
            {isTyping && (
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides */}
          {messages.length <= 1 && !isTyping && (
            <div className={styles.quickReplies}>
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  className={styles.quickReply}
                  onClick={() => handleQuickReply(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Zone de saisie */}
          <div className={styles.inputContainer}>
            <input
              ref={inputRef}
              type="text"
              className={styles.inputField}
              placeholder="Écrivez votre message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        className={`${styles.chatbotButton} ${isOpen ? styles.isOpen : ''}`}
        onClick={toggleChat}
      >
        {isOpen ? <FaTimes /> : <FaComments />}
        {hasNewMessage && !isOpen && (
          <span className={styles.notificationBadge}>1</span>
        )}
      </button>
    </div>
  );
}
