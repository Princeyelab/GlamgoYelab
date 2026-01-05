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
    answer: 'C\'est tres simple ! Choisissez le service qui vous fait envie, indiquez votre adresse et la date souhaitee, puis selectionnez le prestataire qui vous convient. En quelques clics, c\'est reserve ! Je reste la si vous avez besoin d\'aide 😊',
  },
  {
    id: '2',
    text: 'Modes de paiement ?',
    answer: 'Vous avez le choix ! Payez par carte bancaire directement dans l\'app (c\'est 100% securise), ou en especes au prestataire si vous preferez. Comme vous voulez, on s\'adapte a vous !',
  },
  {
    id: '3',
    text: 'Annuler une reservation ?',
    answer: 'Pas de souci, ca arrive ! Allez dans "Mes reservations" et cliquez sur "Annuler". Si c\'est au moins 2h avant le rendez-vous, c\'est gratuit. On espere vous revoir bientot !',
  },
  {
    id: '4',
    text: 'Contacter le prestataire ?',
    answer: 'Bien sur ! Des que votre reservation est confirmee, vous pouvez discuter avec votre prestataire via le chat. C\'est pratique pour les petits details de derniere minute.',
  },
  {
    id: '5',
    text: 'Probleme avec ma commande ?',
    answer: 'Oh non, je suis desolee ! Dites-moi ce qui s\'est passe. Vous pouvez signaler le souci depuis votre commande, ou m\'ecrire a support@glamgo.ma. Je fais tout pour vous aider rapidement !',
  },
];

const BOT_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['bonjour', 'salut', 'hello', 'hi', 'salam', 'coucou'],
    response: 'Bonjour ! Je suis Yamina, votre assistante GlamGo. Comment puis-je vous aider ?',
  },
  {
    keywords: ['yamina', 'qui es tu', 'tu es qui', 'c\'est qui'],
    response: 'Je suis Yamina, votre assistante personnelle GlamGo ! Je suis la pour repondre a toutes vos questions et vous faciliter la vie. N\'hesitez pas, je suis disponible 24h/24 !',
  },
  {
    keywords: ['glamgo', 'c\'est quoi', 'qu\'est-ce que', 'application', 'appli', 'comment ca marche', 'fonctionnement'],
    response: 'GlamGo, c\'est votre application de services a domicile ! Beaute, bien-etre, menage, bricolage... Des professionnels verifies viennent directement chez vous. Vous choisissez le service, la date, le prestataire, et on s\'occupe du reste. Simple, pratique et sans vous deplacer !',
  },
  {
    keywords: ['prix', 'tarif', 'cout', 'combien', 'cher'],
    response: 'Les prix dependent du service et du prestataire que vous choisissez. Vous verrez le prix exact avant de confirmer, sans surprise ! Les frais de deplacement sont calcules selon la distance, tout est transparent 😊',
  },
  {
    keywords: ['reservation', 'reserver', 'rdv', 'rendez-vous'],
    response: 'Reserver, c\'est tres facile ! Choisissez votre service prefere, indiquez ou et quand, puis selectionnez votre prestataire. En 2 minutes c\'est fait ! Besoin que je vous guide ?',
  },
  {
    keywords: ['annuler', 'annulation', 'rembours'],
    response: 'Pas de probleme ! Vous pouvez annuler gratuitement jusqu\'a 2h avant le RDV depuis "Mes reservations". Si vous avez paye par carte, le remboursement est automatique. Ca arrive a tout le monde !',
  },
  {
    keywords: ['paiement', 'payer', 'carte', 'espece', 'cash'],
    response: 'Vous etes libre de choisir ! Carte bancaire (100% securise dans l\'app) ou especes au prestataire. Ce qui vous arrange le mieux !',
  },
  {
    keywords: ['prestataire', 'coiffeur', 'coiffeuse', 'estheticienne', 'pro'],
    response: 'Nos prestataires sont tous verifies et professionnels. Regardez leurs avis et leurs notes pour choisir celui qui vous correspond. Vous etes entre de bonnes mains !',
  },
  {
    keywords: ['horaire', 'heure', 'disponible', 'quand', 'creneau'],
    response: 'Chaque prestataire a ses propres disponibilites. Quand vous reservez, vous voyez en direct les creneaux libres. Pratique, non ?',
  },
  {
    keywords: ['adresse', 'domicile', 'deplacement', 'venir', 'maison'],
    response: 'Le top, c\'est que le prestataire vient directement chez vous ! Indiquez votre adresse et installez-vous confortablement. Le luxe a domicile 💅',
  },
  {
    keywords: ['contact', 'telephone', 'email', 'support', 'aide', 'probleme'],
    response: 'Je suis la pour vous ! Si j\'arrive pas a vous aider, ecrivez a support@glamgo.ma et l\'equipe vous repondra dans les 24h. On ne vous laisse jamais tomber !',
  },
  {
    keywords: ['merci', 'thanks', 'super', 'parfait', 'genial', 'top', 'cool'],
    response: 'Avec grand plaisir ! Ca me fait plaisir de vous aider. Passez une excellente journee et prenez soin de vous ! 💕',
  },
  {
    keywords: ['au revoir', 'bye', 'a bientot', 'ciao', 'tchao'],
    response: 'A tres bientot ! N\'hesitez pas a revenir me voir si vous avez des questions. Prenez soin de vous ! 👋💕',
  },
  {
    keywords: ['retard', 'attend', 'arrive pas', 'ou est'],
    response: 'Je comprends votre inquietude. Vous pouvez suivre le trajet de votre prestataire en temps reel depuis la reservation. Si le retard est important, contactez-le via le chat ou appelez-le. Je suis la si ca ne s\'arrange pas !',
  },
  {
    keywords: ['avis', 'note', 'evaluation', 'etoile'],
    response: 'Apres chaque prestation, vous pouvez noter et laisser un commentaire. C\'est super important pour les autres clientes et pour les prestataires ! Votre avis compte vraiment 🌟',
  },
];

const DEFAULT_RESPONSE = 'Hmm, je n\'ai pas bien compris votre question. Pouvez-vous reformuler ou choisir une des questions ci-dessous ? Je veux vraiment vous aider ! 😊';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: 'Bonjour, moi c\'est Yamina, votre assistante GlamGo. Comment puis-je vous aider aujourd\'hui ?',
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
          <View style={styles.chatContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <View style={styles.botAvatar}>
                  <Text style={styles.botAvatarText}>👩🏽</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>Yamina</Text>
                  <Text style={styles.headerSubtitle}>Votre assistante • En ligne</Text>
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
                  <Text style={styles.quickQuestionsTitle}>💡 Je peux vous aider avec :</Text>
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
                placeholder="Ecrivez a Yamina..."
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
