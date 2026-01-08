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
  I18nManager,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { hapticFeedback } from '../../lib/utils/haptics';
import { useLanguage } from '../../contexts/LanguageContext';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface QuickQuestion {
  id: string;
  textKey: string;
  answerKey: string;
}

// Keys pour les questions rapides
const QUICK_QUESTION_KEYS: QuickQuestion[] = [
  { id: '1', textKey: 'chat.howToBook', answerKey: 'chat.howToBookAnswer' },
  { id: '2', textKey: 'chat.paymentMethods', answerKey: 'chat.paymentMethodsAnswer' },
  { id: '3', textKey: 'chat.cancelBooking', answerKey: 'chat.cancelBookingAnswer' },
  { id: '4', textKey: 'chat.contactProvider', answerKey: 'chat.contactProviderAnswer' },
  { id: '5', textKey: 'chat.orderProblem', answerKey: 'chat.orderProblemAnswer' },
];

// Mapping des reponses du bot selon les mots-cles
const BOT_RESPONSE_KEYS: { keywords: string[]; responseKey: string }[] = [
  { keywords: ['bonjour', 'salut', 'hello', 'hi', 'salam', 'coucou', 'مرحبا', 'اهلا'], responseKey: 'chat.greetingResponse' },
  { keywords: ['yamina', 'qui es tu', 'tu es qui', 'يمينة', 'من انت'], responseKey: 'chat.whoAmIResponse' },
  { keywords: ['glamgo', 'c\'est quoi', 'application', 'ما هو', 'التطبيق'], responseKey: 'chat.aboutAppResponse' },
  { keywords: ['prix', 'tarif', 'cout', 'combien', 'سعر', 'كم'], responseKey: 'chat.priceResponse' },
  { keywords: ['reservation', 'reserver', 'rdv', 'حجز', 'احجز'], responseKey: 'chat.bookingResponse' },
  { keywords: ['annuler', 'annulation', 'الغاء'], responseKey: 'chat.cancellationResponse' },
  { keywords: ['paiement', 'payer', 'carte', 'espece', 'دفع', 'بطاقة'], responseKey: 'chat.paymentResponse' },
  { keywords: ['prestataire', 'coiffeur', 'مقدم', 'خدمة'], responseKey: 'chat.providerResponse' },
  { keywords: ['horaire', 'heure', 'disponible', 'موعد', 'متاح'], responseKey: 'chat.scheduleResponse' },
  { keywords: ['adresse', 'domicile', 'عنوان', 'منزل'], responseKey: 'chat.addressResponse' },
  { keywords: ['contact', 'support', 'aide', 'دعم', 'مساعدة'], responseKey: 'chat.supportResponse' },
  { keywords: ['merci', 'thanks', 'شكرا'], responseKey: 'chat.thanksResponse' },
  { keywords: ['au revoir', 'bye', 'مع السلامة'], responseKey: 'chat.goodbyeResponse' },
  { keywords: ['retard', 'attend', 'تاخر', 'انتظر'], responseKey: 'chat.delayResponse' },
  { keywords: ['avis', 'note', 'evaluation', 'تقييم'], responseKey: 'chat.reviewResponse' },
];

export default function ChatBot() {
  const { t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initialize and update welcome message with translation
  useEffect(() => {
    // Update welcome message when language changes
    setMessages([{
      id: '0',
      text: t('chat.assistantWelcome'),
      isBot: true,
      timestamp: new Date(),
    }]);
  }, [t]);

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

    for (const item of BOT_RESPONSE_KEYS) {
      if (item.keywords.some(keyword => lowerText.includes(keyword))) {
        return t(item.responseKey);
      }
    }

    return t('chat.defaultResponse');
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
      text: t(question.textKey),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: t(question.answerKey),
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
        <Animated.View style={[styles.floatingButton, isRTL && styles.floatingButtonRTL, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.floatingButtonInner}
            onPress={openChat}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingButtonIcon}>👩🏽</Text>
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
          <View style={[styles.chatContainer, isRTL && styles.chatContainerRTL]}>
            {/* Header */}
            <View style={[styles.header, isRTL && styles.headerRTL]}>
              <View style={[styles.headerInfo, isRTL && styles.headerInfoRTL]}>
                <View style={[styles.botAvatar, isRTL && styles.botAvatarRTL]}>
                  <Text style={styles.botAvatarText}>👩🏽</Text>
                </View>
                <View>
                  <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t('chat.assistant')}</Text>
                  <Text style={[styles.headerSubtitle, isRTL && styles.textRTL]}>{t('chat.yourAssistant')} • {t('chat.online')}</Text>
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
                    message.isBot && isRTL && styles.botBubbleRTL,
                    !message.isBot && isRTL && styles.userBubbleRTL,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isRTL && styles.textRTL,
                      message.isBot ? styles.botText : styles.userText,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              ))}

              {isTyping && (
                <View style={[styles.messageBubble, styles.botBubble, isRTL && styles.botBubbleRTL]}>
                  <Text style={styles.typingText}>{t('chat.thinking')}</Text>
                </View>
              )}

              {/* Quick Questions */}
              {messages.length <= 2 && (
                <View style={styles.quickQuestions}>
                  <Text style={[styles.quickQuestionsTitle, isRTL && styles.textRTL]}>💡 {t('chat.canHelpWith')}</Text>
                  {QUICK_QUESTION_KEYS.map((q) => (
                    <TouchableOpacity
                      key={q.id}
                      style={styles.quickQuestionButton}
                      onPress={() => handleQuickQuestion(q)}
                    >
                      <Text style={[styles.quickQuestionText, isRTL && styles.textRTL]}>{t(q.textKey)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={[styles.inputContainer, isRTL && styles.inputContainerRTL]}>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t('chat.writeToYamina')}
                placeholderTextColor={colors.gray[400]}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => sendMessage(inputText)}
                returnKeyType="send"
                multiline={false}
                textAlign={isRTL ? 'right' : 'left'}
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim()}
              >
                <Text style={[styles.sendButtonText, isRTL && styles.sendButtonTextRTL]}>{isRTL ? '◂' : '➤'}</Text>
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
    bottom: 110,
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
  // RTL Styles
  floatingButtonRTL: {
    right: undefined,
    left: 16,
  },
  chatContainerRTL: {
    direction: 'rtl',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerInfoRTL: {
    flexDirection: 'row-reverse',
  },
  botAvatarRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  botBubbleRTL: {
    alignSelf: 'flex-end',
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: 4,
  },
  userBubbleRTL: {
    alignSelf: 'flex-start',
    borderBottomRightRadius: borderRadius.lg,
    borderBottomLeftRadius: 4,
  },
  inputContainerRTL: {
    flexDirection: 'row-reverse',
  },
  inputRTL: {
    textAlign: 'right',
  },
  sendButtonTextRTL: {
    transform: [{ rotate: '180deg' }],
  },
});
