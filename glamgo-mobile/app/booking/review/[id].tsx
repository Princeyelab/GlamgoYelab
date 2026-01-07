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
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { getServiceTranslation } from '../../../src/i18n/translations/services';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, isRTL, language } = useLanguage();

  const RATING_LABELS = [
    { value: 1, label: t('reviewScreen.veryBad'), emoji: '😞' },
    { value: 2, label: t('reviewScreen.bad'), emoji: '😕' },
    { value: 3, label: t('reviewScreen.average'), emoji: '😐' },
    { value: 4, label: t('reviewScreen.good'), emoji: '😊' },
    { value: 5, label: t('reviewScreen.excellent'), emoji: '🤩' },
  ];

  const QUICK_COMMENTS = [
    t('reviewScreen.professionalService'),
    t('reviewScreen.veryPunctual'),
    t('reviewScreen.perfectResult'),
    t('reviewScreen.veryFriendly'),
    t('reviewScreen.goodValueForMoney'),
    t('reviewScreen.recommended'),
  ];

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
      Alert.alert(t('reviewScreen.ratingRequired'), t('reviewScreen.selectRating'));
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
          t('reviewScreen.thankYou'),
          t('reviewScreen.reviewHelps'),
          [
            {
              text: t('reviewScreen.finish'),
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
          t('reviewScreen.thankYou'),
          t('reviewScreen.reviewHelps'),
          [
            {
              text: t('reviewScreen.finish'),
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
      t('reviewScreen.skipTitle'),
      t('reviewScreen.skipMessage'),
      [
        { text: t('reviewScreen.cancel'), style: 'cancel' },
        {
          text: t('reviewScreen.skipBtn'),
          onPress: () => router.replace('/(client)/bookings'),
        },
      ]
    );
  };

  const getRatingLabel = () => {
    if (rating === 0) return t('reviewScreen.tapToRate');
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
          <Text style={[styles.loadingText, isRTL && styles.textRTL]}>{t('reviewScreen.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={[styles.errorText, isRTL && styles.textRTL]}>{t('reviewScreen.bookingNotFound')}</Text>
          <Button variant="outline" onPress={() => router.back()}>
            {t('reviewScreen.back')}
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
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t('reviewScreen.title')}</Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, isRTL && styles.textRTL]}>{t('reviewScreen.skip')}</Text>
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
            <Text style={[styles.providerName, isRTL && styles.textRTL]}>{booking.provider?.name}</Text>
            <Text style={[styles.serviceName, isRTL && styles.textRTL]}>{getServiceTranslation(booking.service?.title || '', language).title}</Text>
          </View>

          {/* Rating Section */}
          <Card style={styles.ratingCard}>
            <Text style={[styles.ratingTitle, isRTL && styles.textRTL]}>{t('reviewScreen.howWasService')}</Text>

            {/* Stars */}
            <View style={[styles.starsContainer, isRTL && styles.starsContainerRTL]}>
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
            <View style={[styles.ratingLabelContainer, isRTL && styles.ratingLabelContainerRTL]}>
              <Text style={styles.ratingEmoji}>{getRatingEmoji()}</Text>
              <Text style={[styles.ratingLabel, isRTL && styles.textRTL]}>{getRatingLabel()}</Text>
            </View>
          </Card>

          {/* Quick Comments */}
          {rating > 0 && (
            <View style={styles.quickCommentsSection}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('reviewScreen.whatDidYouLike')}</Text>
              <View style={[styles.quickCommentsContainer, isRTL && styles.quickCommentsContainerRTL]}>
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
                        isRTL && styles.textRTL,
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
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('reviewScreen.addComment')}</Text>
              <TextInput
                style={[styles.commentInput, isRTL && styles.commentInputRTL]}
                placeholder={t('reviewScreen.commentPlaceholder')}
                placeholderTextColor={colors.gray[400]}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                textAlign={isRTL ? 'right' : 'left'}
              />
              <Text style={[styles.characterCount, isRTL && styles.characterCountRTL]}>{comment.length}/500</Text>
            </View>
          )}

          {/* Info */}
          <View style={[styles.infoBox, isRTL && styles.infoBoxRTL]}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={[styles.infoText, isRTL && styles.textRTL]}>
              {t('reviewScreen.infoText')}
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
            {isSubmitting ? t('reviewScreen.sending') : t('reviewScreen.publishReview')}
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

  // RTL Styles
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  starsContainerRTL: {
    flexDirection: 'row-reverse',
  },
  ratingLabelContainerRTL: {
    flexDirection: 'row-reverse',
  },
  quickCommentsContainerRTL: {
    flexDirection: 'row-reverse',
  },
  commentInputRTL: {
    textAlign: 'right',
  },
  characterCountRTL: {
    textAlign: 'left',
  },
  infoBoxRTL: {
    flexDirection: 'row-reverse',
  },
});
