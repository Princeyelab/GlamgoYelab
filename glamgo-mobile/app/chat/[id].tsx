/**
 * Chat Screen - GlamGo Mobile
 * Conversation entre client et prestataire pour une commande
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { useAppSelector } from '../../src/lib/store/hooks';
import { selectUserRole } from '../../src/lib/store/slices/authSlice';
import apiClient, { API_BASE_URL } from '../../src/lib/api/client';
import { hapticFeedback } from '../../src/lib/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  id: number;
  content: string;
  sender_type: 'user' | 'provider';
  sender_name?: string;
  is_read: boolean;
  created_at: string;
  image_url?: string;
  message_type?: 'text' | 'image';
}

// Messages rapides
const QUICK_MESSAGES_PROVIDER = [
  'Je suis en route',
  "J'arrive dans 5 min",
  'Je suis arrive(e)',
  'Je commence',
  'Service termine',
];

const QUICK_MESSAGES_CLIENT = [
  'OK',
  'Merci',
  'Ou etes-vous ?',
  "J'attends",
  'Parfait',
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const orderId = typeof id === 'string' ? parseInt(id, 10) : 0;
  const userRole = useAppSelector(selectUserRole);
  const isProvider = userRole === 'provider';

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({});
  const flatListRef = useRef<FlatList>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  const quickMessages = isProvider ? QUICK_MESSAGES_PROVIDER : QUICK_MESSAGES_CLIENT;

  // Choisir une image depuis la galerie
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisez l\'acces a la galerie pour envoyer des photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('[Chat] Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de selectionner l\'image');
    }
  };

  // Prendre une photo avec la camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisez l\'acces a la camera pour prendre des photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('[Chat] Error taking photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  // Upload image to server
  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    hapticFeedback.light();

    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await apiClient.post(
        `/api/orders/${orderId}/messages/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('[Chat] Upload response:', JSON.stringify(response.data, null, 2));

      if (response.data?.success) {
        const responseData = response.data.data;
        // Le backend retourne { message: {...}, image_url: "/uploads/..." }
        const rawMsg = responseData.message || responseData;
        const relativeUrl = responseData.image_url || rawMsg.image_url || rawMsg.imageUrl;

        // Construire l'URL complete (l'API retourne une URL relative)
        const fullImageUrl = relativeUrl?.startsWith('http')
          ? relativeUrl
          : `${API_BASE_URL}${relativeUrl}`;

        const newMsg = {
          ...rawMsg,
          image_url: fullImageUrl,
          message_type: 'image' as const,
        };
        console.log('[Chat] New message with image_url:', newMsg.image_url);
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        hapticFeedback.success();
      } else {
        Alert.alert('Erreur', response.data?.message || 'Impossible d\'envoyer la photo');
      }
    } catch (error: any) {
      console.log('[Chat] Error uploading image:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la photo');
    } finally {
      setIsUploading(false);
    }
  };

  // Afficher le choix photo/camera
  const showImageOptions = () => {
    hapticFeedback.light();
    Alert.alert(
      'Envoyer une photo',
      'Choisissez une option',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: '📷 Camera', onPress: takePhoto },
        { text: '🖼️ Galerie', onPress: pickImage },
      ]
    );
  };

  // Charger les messages
  const loadMessages = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/orders/${orderId}/messages`);
      const data = response.data?.data?.messages || response.data?.data || response.data?.messages || [];
      const rawList = Array.isArray(data) ? data : [];

      // Debug: Afficher les messages avec images
      if (__DEV__) {
        const imgMessages = rawList.filter((m: any) => m.attachment_url || m.image_url || m.message_type === 'image');
        if (imgMessages.length > 0) {
          console.log('[Chat] Messages with images:', imgMessages.map((m: any) => ({
            id: m.id,
            attachment_url: m.attachment_url,
            image_url: m.image_url,
            message_type: m.message_type,
          })));
        }
      }

      // Normaliser les URLs d'images (convertir les URLs relatives en absolues)
      // Le backend stocke l'image dans attachment_url, pas image_url
      const messageList = rawList.map((msg: any) => {
        const imageUrl = msg.image_url || msg.attachment_url;
        if (imageUrl) {
          const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
          return { ...msg, image_url: fullUrl, message_type: msg.message_type || 'image' };
        }
        return msg;
      });

      // Detecter nouveaux messages de l'autre personne
      if (!isFirstLoadRef.current && messageList.length > lastMessageCountRef.current) {
        const newMessages = messageList.slice(lastMessageCountRef.current);
        const otherPersonMessages = newMessages.filter((msg: Message) => {
          const isMine = (isProvider && msg.sender_type === 'provider') ||
                        (!isProvider && msg.sender_type === 'user');
          return !isMine;
        });

        if (otherPersonMessages.length > 0) {
          const lastMsg = otherPersonMessages[otherPersonMessages.length - 1];
          const msgContent = lastMsg.image_url ? '📷 Photo' : (lastMsg.content || 'Nouveau message');
          Alert.alert(
            '💬 Nouveau message',
            msgContent.length > 50
              ? msgContent.substring(0, 50) + '...'
              : msgContent
          );
        }
      }

      lastMessageCountRef.current = messageList.length;
      isFirstLoadRef.current = false;
      setMessages(messageList);
    } catch (error) {
      console.log('[Chat] Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, isProvider]);

  // Polling pour les nouveaux messages
  useEffect(() => {
    loadMessages();
    pollIntervalRef.current = setInterval(loadMessages, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [loadMessages]);

  // Envoyer un message
  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const response = await apiClient.post(`/api/orders/${orderId}/messages`, {
        content: messageToSend,
      });

      if (response.data?.success) {
        const newMsg = response.data.data;
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error: any) {
      Alert.alert('Erreur', "Impossible d'envoyer le message");
      setNewMessage(messageToSend); // Restaurer le message
    } finally {
      setIsSending(false);
    }
  };

  // Utiliser un message rapide
  const handleQuickMessage = (msg: string) => {
    setNewMessage(msg);
  };

  // Formater l'heure
  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Render un message
  const renderMessage = ({ item }: { item: Message }) => {
    if (!item) return null;

    const isMine = (isProvider && item.sender_type === 'provider') ||
                   (!isProvider && item.sender_type === 'user');
    const hasImage = item.image_url || item.message_type === 'image';

    return (
      <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
        <View style={[
          styles.messageBubble,
          isMine ? styles.messageMine : styles.messageOther,
          hasImage && styles.messageBubbleImage,
        ]}>
          {!isMine && item.sender_name && (
            <Text style={styles.senderName}>{item.sender_name}</Text>
          )}

          {/* Image */}
          {hasImage && item.image_url && (
            <TouchableOpacity onPress={() => setSelectedImage(item.image_url!)}>
              <View style={styles.imageContainer}>
                {imageLoadingStates[item.id] === 'loading' && (
                  <View style={styles.imagePlaceholder}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.imagePlaceholderText}>Chargement...</Text>
                  </View>
                )}
                {imageLoadingStates[item.id] === 'error' && (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imageErrorIcon}>🖼️</Text>
                    <Text style={styles.imagePlaceholderText}>Image non disponible</Text>
                  </View>
                )}
                <Image
                  source={{ uri: item.image_url }}
                  style={[
                    styles.messageImage,
                    (imageLoadingStates[item.id] === 'loading' || imageLoadingStates[item.id] === 'error') && styles.imageHidden,
                  ]}
                  resizeMode="cover"
                  onLoadStart={() => setImageLoadingStates(prev => ({ ...prev, [item.id]: 'loading' }))}
                  onLoad={() => setImageLoadingStates(prev => ({ ...prev, [item.id]: 'loaded' }))}
                  onError={() => {
                    console.log('[Chat] Image load error for:', item.image_url);
                    setImageLoadingStates(prev => ({ ...prev, [item.id]: 'error' }));
                  }}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Text content */}
          {item.content && !hasImage && (
            <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
              {item.content}
            </Text>
          )}

          {/* Caption for image - masquer les textes par defaut comme [Image], [Photo], etc. */}
          {hasImage && item.content && !['[Photo]', '[Image]', '[Image envoyee]'].includes(item.content) && (
            <Text style={[styles.messageText, isMine && styles.messageTextMine, styles.imageCaption]}>
              {item.content}
            </Text>
          )}

          <Text style={[styles.messageTime, isMine && styles.messageTimeMine]}>
            {formatTime(item.created_at)}
            {isMine && (item.is_read ? ' - Lu' : '')}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {isProvider ? 'Chat Client' : 'Chat Prestataire'}
            </Text>
            <Text style={styles.headerSubtitle}>Commande #{orderId}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item?.id?.toString() || `msg-${index}`}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          style={styles.messagesContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>Aucun message</Text>
              <Text style={styles.emptySubtext}>Commencez la conversation</Text>
            </View>
          }
          ListHeaderComponent={
            <View style={styles.securityWarning}>
              <Text style={styles.securityText}>
                🔒 Ne partagez jamais vos coordonnees personnelles
              </Text>
            </View>
          }
        />

        {/* Bottom Input Area */}
        <View style={styles.bottomArea}>
          {/* Quick Messages */}
          <View style={styles.quickMessages}>
            <FlatList
              horizontal
              data={quickMessages}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.quickMessageBtn}
                  onPress={() => handleQuickMessage(item)}
                >
                  <Text style={styles.quickMessageText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickMessagesList}
            />
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            {/* Photo Button */}
            <TouchableOpacity
              style={styles.photoButton}
              onPress={showImageOptions}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.photoButtonIcon}>📷</Text>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Ecrivez votre message..."
              placeholderTextColor={colors.gray[400]}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.sendButtonText}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Viewer Modal */}
        <Modal
          visible={!!selectedImage}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={styles.imageViewerOverlay}>
            <TouchableOpacity
              style={styles.imageViewerClose}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.imageViewerCloseText}>✕</Text>
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.imageViewerImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.gray[600],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.primary,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: colors.white,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  headerSpacer: {
    width: 36,
  },

  // Messages Container
  messagesContainer: {
    flex: 1,
  },

  // Security Warning
  securityWarning: {
    backgroundColor: colors.warning + '30',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
  },
  securityText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[700],
    textAlign: 'center',
  },

  // Messages
  messagesList: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
  },
  messageRow: {
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  messageRowMine: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  messageOther: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
  },
  messageMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  messageText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    lineHeight: 20,
  },
  messageTextMine: {
    color: colors.white,
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMine: {
    color: colors.white + '80',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },

  // Bottom Area
  bottomArea: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingBottom: Platform.OS === 'ios' ? spacing.md : spacing.sm,
  },

  // Quick Messages
  quickMessages: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  quickMessagesList: {
    paddingHorizontal: spacing.sm,
  },
  quickMessageBtn: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  quickMessageText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '500',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.sm,
    maxHeight: 100,
    minHeight: 44,
    color: colors.gray[900],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 20,
  },

  // Photo Button
  photoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  photoButtonIcon: {
    fontSize: 20,
  },

  // Message Image
  messageBubbleImage: {
    padding: spacing.xs,
    backgroundColor: colors.white,
  },
  imageContainer: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.45,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  messageImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  imageHidden: {
    position: 'absolute',
    opacity: 0,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  imageErrorIcon: {
    fontSize: 32,
  },
  imageCaption: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },

  // Image Viewer Modal
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageViewerCloseText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageViewerImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
  },
});
