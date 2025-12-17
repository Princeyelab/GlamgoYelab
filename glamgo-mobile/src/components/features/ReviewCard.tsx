import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { colors, spacing, borderRadius, typography } from '../../lib/constants/theme';
import { ReviewCardProps } from '../../types/review';

export default function ReviewCard({
  id,
  user,
  service,
  rating,
  comment,
  date,
  isVerified = false,
  helpfulCount = 0,
  providerResponse,
  variant = 'default',
  showService = false,
  onHelpful,
}: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localHelpfulCount, setLocalHelpfulCount] = useState(helpfulCount);
  const [hasVoted, setHasVoted] = useState(false);

  // Format date (ex: "Il y a 3 jours")
  const formatDate = (dateStr: string): string => {
    const now = new Date();
    const reviewDate = new Date(dateStr);
    const diffMs = now.getTime() - reviewDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
  };

  // Render stars
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    return stars;
  };

  // Handle helpful vote
  const handleHelpful = () => {
    if (!hasVoted) {
      setLocalHelpfulCount((prev) => prev + 1);
      setHasVoted(true);
      onHelpful?.(id);
    }
  };

  // Détecter si commentaire long
  const isLongComment = comment.length > 200;
  const displayComment =
    isExpanded || !isLongComment ? comment : comment.substring(0, 200) + '...';

  // Get helpful text
  const getHelpfulText = (): string => {
    if (localHelpfulCount === 0) return 'Utile ?';
    const personWord = localHelpfulCount > 1 ? 'personnes' : 'personne';
    const verbWord = localHelpfulCount > 1 ? 'trouvent' : 'trouve';
    const suffix = hasVoted ? ' (vous inclus)' : '';
    return `${localHelpfulCount} ${personWord} ${verbWord} cela utile${suffix}`;
  };

  const cardStyle: ViewStyle = variant === 'compact'
    ? { marginBottom: spacing.md }
    : { marginBottom: spacing.base };

  return (
    <Card padding="md" style={cardStyle}>
      {/* Header */}
      <View style={styles.header}>
        {/* User Avatar */}
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{user.name}</Text>
            {isVerified && (
              <Badge
                color="success"
                variant="soft"
                size="sm"
                style={styles.verifiedBadge}
              >
                {"Vérifié"}
              </Badge>
            )}
          </View>
          <Text style={styles.date}>{formatDate(date)}</Text>
        </View>
      </View>

      {/* Rating Stars */}
      <View style={styles.ratingContainer}>{renderStars()}</View>

      {/* Service Info (si showService) */}
      {showService && service && (
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceLabel}>Service : </Text>
          <Text style={styles.serviceName}>{service.name}</Text>
        </View>
      )}

      {/* Comment */}
      <Text style={styles.comment}>{displayComment}</Text>

      {/* Read More Button */}
      {isLongComment && (
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={styles.readMoreButton}>
            {isExpanded ? 'Voir moins' : 'Lire la suite'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Provider Response */}
      {providerResponse && (
        <View style={styles.providerResponse}>
          <Text style={styles.providerResponseLabel}>
            Réponse du prestataire
          </Text>
          <Text style={styles.providerResponseText}>
            {providerResponse.text}
          </Text>
          <Text style={styles.providerResponseDate}>
            {formatDate(providerResponse.date)}
          </Text>
        </View>
      )}

      {/* Helpful Button */}
      <TouchableOpacity
        style={hasVoted ? { ...styles.helpfulButton, ...styles.helpfulButtonActive } : styles.helpfulButton}
        onPress={handleHelpful}
        disabled={hasVoted}
      >
        <Text style={styles.helpfulIcon}>👍</Text>
        <Text style={hasVoted ? { ...styles.helpfulText, ...styles.helpfulTextActive } : styles.helpfulText}>
          {getHelpfulText()}
        </Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  date: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  star: {
    fontSize: 18,
    marginRight: 2,
  },

  // Service Info
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.sm,
  },
  serviceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  serviceName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
  },

  // Comment
  comment: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  readMoreButton: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  // Provider Response
  providerResponse: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    marginBottom: spacing.md,
  },
  providerResponseLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  providerResponseText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  providerResponseDate: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },

  // Helpful Button
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  helpfulButtonActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  helpfulIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  helpfulText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  helpfulTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
