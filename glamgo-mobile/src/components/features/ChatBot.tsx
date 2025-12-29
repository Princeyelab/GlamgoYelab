/**
 * ChatBot Component - GlamGo Mobile
 * Assistant virtuel pour repondre aux questions des clients
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { hapticFeedback } from '../../lib/utils/haptics';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface QuickQuestion {
  id: string;
  text: string;
  answer: string;
}

const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: '1',
    text: 'Comment reserver ?',
    answer: 'Pour reserver, choisissez un service, selectionnez une date et une adresse, puis choisissez un prestataire disponible. Confirmez votre reservation et payez en ligne ou en especes.',
  },
  {
    id: '2',
    text: 'Modes de paiement ?',
    answer: 'Nous acceptons les paiements par carte bancaire et en especes. Le paiement par carte est securise et vous pouvez payer directement dans l\'application.',
  },
  {
    id: '3',
    text: 'Annuler une reservation ?',
    answer: 'Vous pouvez annuler votre reservation depuis l\'onglet "Mes reservations". L\'annulation est gratuite si elle est faite au moins 2 heures avant le rendez-vous.',
  },
  {
    id: '4',
    text: 'Contacter le prestataire ?',
    answer: 'Une fois votre reservation confirmee, vous pouvez contacter le prestataire via le chat integre dans les details de votre reservation.',
  },
  {
    id: '5',
    text: 'Probleme avec ma commande ?',
    answer: 'En cas de probleme, vous pouvez signaler un incident depuis les details de votre commande ou nous contacter a support@glamgo.ma',
  },
];

const BOT_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['bonjour', 'salut', 'hello', 'hi', 'salam'],
    response: 'Bonjour ! Je suis l\'assistant GlamGo. Comment puis-je vous aider aujourd\'hui ?',
  },
  {
    keywords: ['prix', 'tarif', 'cout', 'combien'],
    response: 'Les prix varient selon le service et le prestataire. Vous pouvez voir le prix exact lors de la reservation. Les frais de deplacement sont calcules automatiquement selon la distance.',
  },
  {
    keywords: ['reservation', 'reserver', 'rdv', 'rendez-vous'],
    response: 'Pour reserver : 1) Choisissez un service 2) Selectionnez date et adresse 3) Choisissez un prestataire 4) Confirmez et payez. C\'est simple !',
  },
  {
    keywords: ['annuler', 'annulation', 'rembours'],
    response: 'Vous pouvez annuler gratuitement jusqu\'a 2h avant le RDV. Allez dans "Mes reservations" et cliquez sur "Annuler". Le remboursement est automatique pour les paiements par carte.',
  },
  {
    keywords: ['paiement', 'payer', 'carte', 'espece', 'cash'],
    response: 'Nous acceptons : carte bancaire (paiement securise) et especes (a remettre au prestataire). Vous choisissez lors de la reservation.',
  },
  {
    keywords: ['prestataire', 'coiffeur', 'coiffeuse', 'estheticienne'],
    response: 'Tous nos prestataires sont verifies et professionnels. Vous pouvez consulter leurs avis et notes avant de reserver.',
  },
  {
    keywords: ['horaire', 'heure', 'disponible', 'quand'],
    response: 'Les prestataires definissent leurs propres horaires. Lors de la reservation, vous verrez les creneaux disponibles en temps reel.',
  },
  {
    keywords: ['adresse', 'domicile', 'deplacement', 'venir'],
    response: 'Nos prestataires se deplacent chez vous ! Indiquez votre adresse lors de la reservation et le prestataire viendra a domicile.',
  },
  {
    keywords: ['contact', 'telephone', 'email', 'support'],
    response: 'Pour nous contacter : support@glamgo.ma ou via le formulaire de contact dans l\'application. Nous repondons sous 24h.',
  },
  {
    keywords: ['merci', 'thanks', 'super', 'parfait', 'genial'],
    response: 'Avec plaisir ! N\'hesitez pas si vous avez d\'autres questions. Bonne journee !',
  },
];

const DEFAULT_RESPONSE = 'Je ne suis pas sur de comprendre votre question. Pouvez-vous reformuler ou choisir une question rapide ci-dessous ?';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: 'Bonjour ! Je suis l\'assistant GlamGo. Comment puis-je vous aider ?',
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation du bouton
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const findBotResponse = (text: string): string => {
    const lowerText = text.toLowerCase();

    for (const item of BOT_RESPONSES) {
      if (item.keywords.some(keyword => lowerText.includes(keyword))) {
        return item.response;
      }
    }

    return DEFAULT_RESPONSE;
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simuler un delai de reponse
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: findBotResponse(text),
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickQuestion = (question: QuickQuestion) => {
    hapticFeedback.light();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: question.text,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: question.answer,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 800);
  };

  const openChat = () => {
    hapticFeedback.light();
    setIsOpen(true);
  };

  const closeChat = () => {
    hapticFeedback.light();
    Keyboard.dismiss();
    setIsOpen(false);
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Animated.View style={[styles.floatingButton, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.floatingButtonInner}
            onPress={openChat}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingButtonIcon}>💬</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={closeChat}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.chatContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <View style={styles.botAvatar}>
                  <Text style={styles.botAvatarText}>🤖</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>Assistant GlamGo</Text>
                  <Text style={styles.headerSubtitle}>En ligne</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeChat}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.isBot ? styles.botBubble : styles.userBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.isBot ? styles.botText : styles.userText,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              ))}

              {isTyping && (
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <Text style={styles.typingText}>...</Text>
                </View>
              )}

              {/* Quick Questions */}
              {messages.length <= 2 && (
                <View style={styles.quickQuestions}>
                  <Text style={styles.quickQuestionsTitle}>Questions frequentes :</Text>
                  {QUICK_QUESTIONS.map((q) => (
                    <TouchableOpacity
                      key={q.id}
                      style={styles.quickQuestionButton}
                      onPress={() => handleQuickQuestion(q)}
                    >
                      <Text style={styles.quickQuestionText}>{q.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Posez votre question..."
                placeholderTextColor={colors.gray[400]}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => sendMessage(inputText)}
                returnKeyType="send"
                multiline={false}
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim()}
              >
                <Text style={styles.sendButtonText}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    zIndex: 1000,
  },
  floatingButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  floatingButtonIcon: {
    fontSize: 18,
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  chatContainer: {
    height: '85%',
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.primary,
    paddingTop: spacing.lg,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  botAvatarText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white + 'CC',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },

  // Messages
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  botBubble: {
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    ...shadows.sm,
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  botText: {
    color: colors.gray[800],
  },
  userText: {
    color: colors.white,
  },
  typingText: {
    fontSize: 24,
    color: colors.gray[400],
    letterSpacing: 4,
  },

  // Quick Questions
  quickQuestions: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  quickQuestionsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  quickQuestionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  quickQuestionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  sendButtonText: {
    fontSize: 20,
    color: colors.white,
  },
});
