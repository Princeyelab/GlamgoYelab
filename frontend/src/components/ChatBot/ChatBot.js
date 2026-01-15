'use client';

import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './ChatBot.module.scss';

// Mots-clés pour détecter l'intention (multilingue)
const intentKeywords = {
  greeting: ['bonjour', 'salut', 'hello', 'hi', 'bonsoir', 'coucou', 'hey', 'hola', 'hallo', 'مرحبا', 'السلام'],
  services: ['service', 'prestation', 'proposez', 'offrez', 'catalogue', 'coiffure', 'maquillage', 'manucure', 'massage', 'beauty', 'hair', 'makeup', 'nail', 'belleza', 'تجميل', 'خدمات'],
  booking: ['réserver', 'commander', 'rendez-vous', 'rdv', 'réservation', 'comment faire', 'book', 'reservation', 'appointment', 'reservar', 'cita', 'حجز', 'موعد'],
  pricing: ['prix', 'tarif', 'coût', 'combien', 'cher', 'frais', 'price', 'cost', 'how much', 'precio', 'coste', 'سعر', 'تكلفة'],
  provider: ['prestataire', 'travailler', 'rejoindre', 'devenir', 'inscription pro', 'provider', 'become', 'join', 'work', 'proveedor', 'مقدم خدمة'],
  payment: ['payer', 'paiement', 'carte', 'wave', 'orange money', 'espèce', 'pay', 'payment', 'card', 'cash', 'pago', 'tarjeta', 'دفع'],
  cancel: ['annuler', 'annulation', 'rembourser', 'remboursement', 'cancel', 'refund', 'cancelar', 'إلغاء'],
  contact: ['contact', 'joindre', 'email', 'téléphone', 'appeler', 'support', 'call', 'contactar', 'llamar', 'اتصال', 'تواصل']
};

export default function ChatBot() {
  const { t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Réponses du bot traduites
  const getBotResponses = () => ({
    greeting: [
      t('chatbot.greeting1') || "Bonjour ! Je suis Yamina, votre assistante GlamGo. Comment puis-je vous aider aujourd'hui ?",
      t('chatbot.greeting2') || "Bienvenue sur GlamGo ! Je suis Yamina, je suis là pour répondre à vos questions.",
      t('chatbot.greeting3') || "Salut ! Je suis Yamina, comment puis-je vous assister ?"
    ],
    services: [t('chatbot.services') || "Nous proposons une large gamme de services de beauté à domicile."],
    booking: [t('chatbot.booking') || "Pour réserver un service, c'est simple..."],
    pricing: [t('chatbot.pricing') || "Nos tarifs varient selon le service choisi."],
    provider: [t('chatbot.provider') || "Vous souhaitez devenir prestataire GlamGo ?"],
    payment: [t('chatbot.payment') || "Nous acceptons plusieurs moyens de paiement."],
    cancel: [t('chatbot.cancel') || "Vous pouvez annuler votre réservation jusqu'à 2 heures avant."],
    contact: [t('chatbot.contact') || "Pour nous contacter..."],
    default: [t('chatbot.default') || "Je ne suis pas sûre de comprendre votre demande."]
  });

  // Suggestions rapides traduites
  const getQuickReplies = () => [
    t('chatbot.quick.services') || "Vos services",
    t('chatbot.quick.booking') || "Comment réserver ?",
    t('chatbot.quick.pricing') || "Les tarifs",
    t('chatbot.quick.provider') || "Devenir prestataire",
    t('chatbot.quick.payment') || "Moyens de paiement"
  ];

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
    const botResponses = getBotResponses();
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
                <h3>{t('chatbot.name') || 'Yamina'}</h3>
                <p>{t('chatbot.online') || 'En ligne'}</p>
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
              {getQuickReplies().map((reply, index) => (
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
              placeholder={t('chatbot.placeholder') || 'Écrivez votre message...'}
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
