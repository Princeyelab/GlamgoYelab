/**
 * Booking Review Screen - GlamGo Mobile
 * Ecran de notation et avis pour une reservation terminee
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/lib/constants/theme';
import { hapticFeedback } from '../../../src/lib/utils/haptics';
import { getBookingById, createReview, Booking } from '../../../src/lib/api/bookingsAPI';

const RATING_LABELS = [
  { value: 1, label: 'Tres mauvais', emoji: '😞' },
  { value: 2, label: 'Mauvais', emoji: '😕' },
  { value: 3, label: 'Moyen', emoji: '😐' },
  { value: 4, label: 'Bien', emoji: '😊' },
  { value: 5, label: 'Excellent', emoji: '🤩' },
];

const QUICK_COMMENTS = [
  'Service professionnel',
  'Tres ponctuel(le)',
  'Resultat impeccable',
  'Tres sympathique',
  'Bon rapport qualite/prix',
  'A recommander',
];

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [selectedQuickComments, setSelectedQuickComments] = useState<string[]>([]);

  // Animations
  const starAnimations = useRef(
    Array(5)
      .fill(0)
      .map(() => new Animated.Value(1))
  ).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // Load booking data
  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      setIsLoading(true);
      if (id) {
        const data = await getBookingById(id);
        setBooking(data);
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      // Demo fallback
      setBooking({
        id: Number(id) || 1,
        user_id: 1,
        provider_id: 1,
        service_id: 1,
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        duration_minutes: 60,
        price: 250,
        total: 250,
        currency: 'MAD',
        address: '123 Boulevard Mohammed V, Casablanca',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        service: {
          id: 1,
          title: 'Coupe femme + Brushing',
        },
        provider: {
          id: 1,
          name: 'Sarah Beaute',
          avatar: 'https://i.pravatar.cc/150?img=5',
          rating: 4.8,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = (value: number) => {
    hapticFeedback.selection();
    setRating(value);

    // Animate the selected star
    Animated.sequence([
      Animated.timing(starAnimations[value - 1], {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(starAnimations[value - 1], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleQuickComment = (text: string) => {
    hapticFeedback.selection();
    setSelectedQuickComments((prev) => {
      if (prev.includes(text)) {
        return prev.filter((c) => c !== text);
      }
      return [...prev, text];
    });
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Note requise', 'Veuillez selectionner une note pour continuer.');
      return;
    }

    hapticFeedback.medium();
    setIsSubmitting(true);

    try {
      // Combine quick comments and custom comment
      const fullComment = [
        ...selectedQuickComments,
        comment.trim(),
      ]
        .filter(Boolean)
        .join('. ');

      await createReview({
        booking_id: booking?.id || 0,
        rating,
        comment: fullComment || undefined,
      });

      hapticFeedback.success();

      // Show success animation
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Alert.alert(
          'Merci pour votre avis !',
          'Votre retour aide la communaute GlamGo.',
          [
            {
              text: 'Terminer',
              onPress: () => router.replace('/(client)/bookings'),
            },
          ]
        );
      }, 500);
    } catch (error) {
      console.error('Review error:', error);
      hapticFeedback.error();

      // Demo mode - simulate success
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Alert.alert(
          'Merci pour votre avis !',
          'Votre retour aide la communaute GlamGo.',
          [
            {
              text: 'Terminer',
              onPress: () => router.replace('/(client)/bookings'),
            },
          ]
        );
      }, 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Passer cette etape ?',
      'Vous pourrez noter cette prestation plus tard.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Passer',
          onPress: () => router.replace('/(client)/bookings'),
        },
      ]
    );
  };

  const getRatingLabel = () => {
    if (rating === 0) return 'Touchez pour noter';
    return RATING_LABELS.find((r) => r.value === rating)?.label || '';
  };

  const getRatingEmoji = () => {
    if (rating === 0) return '⭐';
    return RATING_LABELS.find((r) => r.value === rating)?.emoji || '⭐';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorText}>Reservation non trouvee</Text>
          <Button variant="outline" onPress={() => router.back()}>
            Retour
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Donner un avis</Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Provider Info */}
          <View style={styles.providerCard}>
            {booking.provider?.avatar ? (
              <Image
                source={{ uri: booking.provider.avatar }}
                style={styles.providerAvatar}
              />
            ) : (
              <View style={[styles.providerAvatar, styles.providerAvatarPlaceholder]}>
                <Text style={styles.providerAvatarText}>
                  {booking.provider?.name?.charAt(0) || 'P'}
                </Text>
              </View>
            )}
            <Text style={styles.providerName}>{booking.provider?.name}</Text>
            <Text style={styles.serviceName}>{booking.service?.title}</Text>
          </View>

          {/* Rating Section */}
          <Card style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Comment etait la prestation ?</Text>

            {/* Stars */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleRating(value)}
                  activeOpacity={0.7}
                >
                  <Animated.Text
                    style={[
                      styles.star,
                      value <= rating && styles.starFilled,
                      { transform: [{ scale: starAnimations[value - 1] }] },
                    ]}
                  >
                    {value <= rating ? '★' : '☆'}
                  </Animated.Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rating Label */}
            <View style={styles.ratingLabelContainer}>
              <Text style={styles.ratingEmoji}>{getRatingEmoji()}</Text>
              <Text style={styles.ratingLabel}>{getRatingLabel()}</Text>
            </View>
          </Card>

          {/* Quick Comments */}
          {rating > 0 && (
            <View style={styles.quickCommentsSection}>
              <Text style={styles.sectionTitle}>Qu'avez-vous apprecie ?</Text>
              <View style={styles.quickCommentsContainer}>
                {QUICK_COMMENTS.map((text) => (
                  <TouchableOpacity
                    key={text}
                    style={[
                      styles.quickCommentChip,
                      selectedQuickComments.includes(text) &&
                        styles.quickCommentChipSelected,
                    ]}
                    onPress={() => handleQuickComment(text)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickCommentText,
                        selectedQuickComments.includes(text) &&
                          styles.quickCommentTextSelected,
                      ]}
                    >
                      {text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Comment Input */}
          {rating > 0 && (
            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>Ajouter un commentaire (optionnel)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Partagez votre experience..."
                placeholderTextColor={colors.gray[400]}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{comment.length}/500</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              Votre avis aide les autres clients a choisir et permet aux prestataires de s'ameliorer.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.footer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting || rating === 0}
            onPress={handleSubmit}
          >
            {isSubmitting ? 'Envoi en cours...' : 'Publier mon avis'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorIcon: {
    fontSize: 64,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[600],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.gray[900],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  skipText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },

  // Provider Card
  providerCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  providerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.md,
  },
  providerAvatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  providerName: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },

  // Rating Card
  ratingCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ratingTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  star: {
    fontSize: 40,
    color: colors.gray[300],
  },
  starFilled: {
    color: colors.warning,
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingEmoji: {
    fontSize: 24,
  },
  ratingLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    fontWeight: '500',
  },

  // Quick Comments
  quickCommentsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  quickCommentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickCommentChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  quickCommentChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickCommentText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  quickCommentTextSelected: {
    color: colors.white,
    fontWeight: '500',
  },

  // Comment Section
  commentSection: {
    marginBottom: spacing.lg,
  },
  commentInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[300],
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    minHeight: 120,
  },
  characterCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.info + '15',
    borderRadius: borderRadius.md,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.info,
    lineHeight: 20,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    ...shadows.lg,
  },
});
