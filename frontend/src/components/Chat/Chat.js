'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './Chat.module.scss';
import apiClient from '@/lib/apiClient';
import { moderateMessage, moderateImage } from '@/lib/contentModeration';
import { analyzeImage as analyzeNSFW, preloadNSFWModel } from '@/lib/nsfwDetection';
import { useLanguage } from '@/contexts/LanguageContext';

// URL de base pour les uploads (backend)
const UPLOADS_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

// Helper pour construire l'URL complete des images
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${UPLOADS_BASE_URL}${path}`;
};

export default function Chat({ orderId, userType = 'user' }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [moderationWarning, setModerationWarning] = useState(null);
  const [showImageConfirm, setShowImageConfirm] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [imageConfirmChecked, setImageConfirmChecked] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [chatActive, setChatActive] = useState(true);
  const [chatDisabledReason, setChatDisabledReason] = useState(null);
  const messagesContainerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const presenceIntervalRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    updatePresence();

    // Precharger le modele NSFW en arriere-plan
    preloadNSFWModel();

    // Polling toutes les 3 secondes pour nouveaux messages
    pollIntervalRef.current = setInterval(fetchMessages, 3000);

    // Mise a jour presence toutes les 30 secondes
    presenceIntervalRef.current = setInterval(updatePresence, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
    };
  }, [orderId]);

  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      scrollToBottom();
      isInitialLoadRef.current = false;
    } else if (isUserAtBottom()) {
      scrollToBottom();
    }
  }, [messages]);

  const isUserAtBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  const updatePresence = async () => {
    try {
      await apiClient.post('/presence/update');
    } catch (err) {
      // Ignorer les erreurs de presence
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await apiClient.getMessages(orderId);
      if (response.success) {
        setMessages(response.data?.messages || response.data || []);

        // Mettre a jour le statut du chat
        if (response.data?.chat_active !== undefined) {
          setChatActive(response.data.chat_active);
          setChatDisabledReason(response.data.chat_disabled_reason);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !chatActive) return;

    // Moderation du message avant envoi
    const moderation = moderateMessage(newMessage.trim());
    if (!moderation.isAllowed) {
      setModerationWarning({
        reason: moderation.reason,
        category: moderation.category
      });
      // Ne pas envoyer le message
      return;
    }

    setModerationWarning(null);
    setSending(true);
    setError('');

    try {
      const response = await apiClient.sendMessage(orderId, newMessage.trim());
      if (response.success) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
      } else {
        setError(response.message || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !chatActive) return;

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Moderation de l'image - bloquer les images avec noms suspects
    const imageModeration = await moderateImage(file);
    if (!imageModeration.isAllowed) {
      setModerationWarning({
        reason: imageModeration.reason,
        category: imageModeration.category || 'inappropriate'
      });
      return;
    }

    // Analyse NSFW du contenu de l'image
    setAnalyzingImage(true);
    setError('');

    try {
      const nsfwResult = await analyzeNSFW(file);

      if (!nsfwResult.isAllowed) {
        setAnalyzingImage(false);
        setModerationWarning({
          reason: nsfwResult.reason,
          category: 'nsfw_' + nsfwResult.category,
          confidence: nsfwResult.confidence
        });
        return;
      }

      // Image autorisee - afficher la confirmation
      setAnalyzingImage(false);
      setPendingImage(file);
      setImageConfirmChecked(false);
      setShowImageConfirm(true);

    } catch (err) {
      console.error('Erreur analyse image:', err);
      setAnalyzingImage(false);
      // En cas d'erreur d'analyse, afficher quand meme la confirmation
      setPendingImage(file);
      setImageConfirmChecked(false);
      setShowImageConfirm(true);
    }
  };

  // Confirmer et envoyer l'image
  const confirmAndSendImage = async () => {
    if (!pendingImage || !imageConfirmChecked) return;

    setShowImageConfirm(false);
    setSending(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', pendingImage);

      const token = apiClient.getToken();
      const response = await fetch(`${apiClient.baseURL}/orders/${orderId}/messages/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, data.data?.message || data.data]);
      } else {
        setError(data.message || 'Erreur lors de l\'upload');
      }
    } catch (err) {
      setError('Erreur lors de l\'envoi de l\'image');
    } finally {
      setSending(false);
      setPendingImage(null);
    }
  };

  // Annuler l'envoi
  const cancelImageUpload = () => {
    setShowImageConfirm(false);
    setPendingImage(null);
    setImageConfirmChecked(false);
  };

  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const quickMessages = userType === 'provider'
    ? [
        t('chat.quick.onMyWay'),
        t('chat.quick.arrive5min'),
        t('chat.quick.arrived'),
        t('chat.quick.starting'),
        t('chat.quick.serviceComplete'),
        'مرحبا',
        'أنا في الطريق',
        'وصلت'
      ]
    : [
        t('chat.quick.ok'),
        t('chat.quick.thanks'),
        t('chat.quick.whereAreYou'),
        t('chat.quick.waiting'),
        t('chat.quick.perfect'),
        'حسناً',
        'شكراً',
        'أين أنت'
      ];

  const handleQuickMessage = (msg) => {
    setNewMessage(msg);
  };

  if (loading) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.loading}>{t('chat.loadingConversation')}</div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <h3>
            {userType === 'provider' ? t('chat.titleClient') : t('chat.title')}
          </h3>
          <span className={styles.secureNote}>{t('chat.secureNote')}</span>
        </div>
        <label className={styles.translationToggle}>
          <input
            type="checkbox"
            checked={showTranslation}
            onChange={(e) => setShowTranslation(e.target.checked)}
          />
          <span>{t('chat.translations')}</span>
        </label>
      </div>

      {!chatActive && (
        <div className={styles.chatDisabled}>
          {chatDisabledReason || t('chat.chatDisabled')}
        </div>
      )}

      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className={styles.noMessages}>
            {t('chat.noMessages')}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${
                message.sender_type === userType ? styles.sent : styles.received
              }`}
            >
              {message.sender_type !== userType && message.sender_name && (
                <div className={styles.senderName}>{message.sender_name}</div>
              )}
              <div className={styles.messageContent}>
                {message.message_type === 'image' && message.attachment_url ? (
                  <div className={styles.messageImage}>
                    <img
                      src={getImageUrl(message.attachment_url)}
                      alt="Image"
                      onClick={() => window.open(getImageUrl(message.attachment_url), '_blank')}
                    />
                  </div>
                ) : (
                  <div className={styles.messageText}>{message.content}</div>
                )}
                {showTranslation && message.translated_content && (
                  <div className={styles.translatedText}>
                    {message.translated_content}
                  </div>
                )}
              </div>
              <div className={styles.messageTime}>
                {formatTime(message.created_at)}
                {message.sender_type === userType && (
                  <span className={`${styles.readIndicator} ${message.is_read == 1 ? styles.read : ''}`}>
                    {message.is_read == 1 ? ` · ${t('chat.read')}` : ` · ${t('chat.sent')}`}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.quickMessages}>
        {quickMessages.map((msg, index) => (
          <button
            key={index}
            type="button"
            className={styles.quickMessageBtn}
            onClick={() => handleQuickMessage(msg)}
            disabled={!chatActive}
          >
            {msg}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {analyzingImage && (
        <div className={styles.analyzingImage}>
          <div className={styles.analyzeSpinner}></div>
          <span>{t('chat.analyzingImage')}</span>
        </div>
      )}

      {moderationWarning && (
        <div className={styles.moderationWarning}>
          <div className={styles.moderationIcon}>
            {moderationWarning.category === 'racism' ? '🚫' :
             moderationWarning.category === 'threat' ? '⚠️' :
             moderationWarning.category === 'contact' ? '📵' :
             moderationWarning.category === 'inappropriate' ? '🔞' :
             moderationWarning.category === 'image_blocked' ? '📷' :
             moderationWarning.category?.startsWith('nsfw_') ? '🔞' : '🛑'}
          </div>
          <div className={styles.moderationText}>
            <strong>{t('chat.contentBlocked')}</strong>
            <p>{moderationWarning.reason}</p>
          </div>
          <button
            className={styles.moderationClose}
            onClick={() => setModerationWarning(null)}
          >
            ✕
          </button>
        </div>
      )}

      {showImageConfirm && (
        <div className={styles.imageConfirmOverlay}>
          <div className={styles.imageConfirmModal}>
            <div className={styles.imageConfirmHeader}>
              <span>⚠️</span>
              <h4>{t('chat.confirmRequired')}</h4>
            </div>
            <div className={styles.imageConfirmContent}>
              <div className={styles.warningBox}>
                <p><strong>🚫 {t('chat.strictlyForbidden')}</strong></p>
                <ul>
                  <li>{t('chat.intimatePhotos')}</li>
                  <li>{t('chat.nudityPhotos')}</li>
                  <li>{t('chat.compromisePhotos')}</li>
                  <li>{t('chat.idPhotos')}</li>
                </ul>
              </div>
              <div className={styles.allowedBox}>
                <p><strong>✅ {t('chat.allowed')}</strong></p>
                <ul>
                  <li>{t('chat.workPhotos')}</li>
                  <li>{t('chat.equipmentPhotos')}</li>
                </ul>
              </div>
              <div className={styles.consequenceBox}>
                <p>⚠️ <strong>{t('chat.violationWarning')}</strong></p>
                <ul>
                  <li>{t('chat.accountSuspension')}</li>
                  <li>{t('chat.authoritiesReport')}</li>
                  <li>{t('chat.legalAction')}</li>
                </ul>
              </div>
              <label className={styles.confirmCheckbox}>
                <input
                  type="checkbox"
                  checked={imageConfirmChecked}
                  onChange={(e) => setImageConfirmChecked(e.target.checked)}
                />
                <span>{t('chat.certifyImage')}</span>
              </label>
            </div>
            <div className={styles.imageConfirmActions}>
              <button className={styles.cancelBtn} onClick={cancelImageUpload}>
                {t('common.cancel')}
              </button>
              <button
                className={styles.confirmBtn}
                onClick={confirmAndSendImage}
                disabled={!imageConfirmChecked}
              >
                {t('chat.sendImage')}
              </button>
            </div>
          </div>
        </div>
      )}


      <div className={styles.securityWarning}>
        🚫 {t('chat.securityWarning')}
      </div>

      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        <label className={styles.uploadBtn} title={t('chat.uploadImage')}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            disabled={sending || !chatActive}
          />
          📎
        </label>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t('chat.writePlaceholder')}
          className={styles.messageInput}
          disabled={sending || !chatActive}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!newMessage.trim() || sending || !chatActive}
        >
          {sending ? '...' : t('chat.send')}
        </button>
      </form>
    </div>
  );
}
