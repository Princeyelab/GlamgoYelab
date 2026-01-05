/**
 * Modal affichant le profil complet d'un prestataire
 * Inclut les services standards et personnalisés
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { API_BASE_URL } from '../../lib/api/client';
import { getProviderCustomServices, CustomService } from '../../lib/api/providerAPI';
import Badge from '../ui/Badge';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Provider {
  id: number;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  name?: string;
  avatar?: string;
  profile_photo?: string;
  rating?: number;
  total_reviews?: number;
  is_verified?: boolean;
  bio?: string;
  specialties?: string;
  custom_services_count?: number;
}

interface ProviderProfileModalProps {
  visible: boolean;
  provider: Provider | null;
  onClose: () => void;
  onSelectService?: (service: CustomService) => void;
}

export default function ProviderProfileModal({
  visible,
  provider,
  onClose,
  onSelectService,
}: ProviderProfileModalProps) {
  const router = useRouter();
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && provider?.id) {
      loadCustomServices();
    }
  }, [visible, provider?.id]);

  const loadCustomServices = async () => {
    if (!provider?.id) return;
    setIsLoading(true);
    try {
      const services = await getProviderCustomServices(provider.id);
      setCustomServices(services);
    } catch (error) {
      console.error('Erreur chargement services personnalisés:', error);
      setCustomServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler pour réserver un service personnalisé
  const handleBookCustomService = (service: CustomService) => {
    Alert.alert(
      'Réserver ce service',
      `Voulez-vous réserver "${service.name}" pour ${service.price} MAD ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réserver',
          onPress: () => {
            onClose();
            // Naviguer vers la page de réservation avec les infos du service personnalisé
            // Utiliser le format URL string pour expo-router
            router.push(`/booking/create?custom_service_id=${service.id}&provider_id=${provider?.id}` as any);
          },
        },
      ]
    );
  };

  if (!provider) return null;

  const name = provider.business_name || provider.name ||
    `${provider.first_name || ''} ${provider.last_name || ''}`.trim() || 'Prestataire';

  const avatarUrl = provider.avatar || provider.profile_photo;
  const rating = typeof provider.rating === 'number' ? provider.rating : parseFloat(String(provider.rating || '0')) || 0;
  const reviewsCount = provider.total_reviews || 0;
  const isVerified = provider.is_verified || false;
  const specialties = provider.specialties?.split(', ').filter(Boolean) || [];

  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('file://')) return path;
    return `${API_BASE_URL}${path}`;
  };

  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={[colors.primary, '#8B5CF6']}
            style={styles.header}
          >
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>

            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image
                  source={{ uri: getImageUrl(avatarUrl) || undefined }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
                </View>
              )}
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                </View>
              )}
            </View>

            <Text style={styles.name}>{name}</Text>

            {/* Rating */}
            <View style={styles.ratingRow}>
              <Text style={styles.stars}>{'★'.repeat(Math.floor(rating || 0))}</Text>
              <Text style={styles.ratingValue}>{(rating || 0).toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({reviewsCount} avis)</Text>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Bio */}
            {provider.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>À propos</Text>
                <Text style={styles.bioText}>{provider.bio}</Text>
              </View>
            )}

            {/* Spécialités */}
            {specialties.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services standards</Text>
                <View style={styles.tagsContainer}>
                  {specialties.map((specialty, index) => (
                    <Badge key={index} color="primary" variant="soft" size="sm">
                      {specialty}
                    </Badge>
                  ))}
                </View>
              </View>
            )}

            {/* Services personnalisés */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✨ Services exclusifs</Text>
                {customServices.length > 0 && (
                  <Badge color="warning" variant="filled" size="sm">
                    {customServices.length}
                  </Badge>
                )}
              </View>

              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.lg }} />
              ) : customServices.length === 0 ? (
                <Text style={styles.emptyText}>
                  Aucun service exclusif pour le moment
                </Text>
              ) : (
                <View style={styles.customServicesList}>
                  {customServices.map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      style={styles.customServiceCard}
                      onPress={() => handleBookCustomService(service)}
                      activeOpacity={0.8}
                    >
                      {/* Image */}
                      {service.images && service.images.length > 0 ? (
                        <Image
                          source={{ uri: getImageUrl(service.images[0]) || undefined }}
                          style={styles.serviceImage}
                        />
                      ) : (
                        <View style={[styles.serviceImage, styles.serviceImagePlaceholder]}>
                          <Ionicons name="sparkles" size={24} color={colors.gray[400]} />
                        </View>
                      )}

                      {/* Info */}
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName} numberOfLines={1}>
                          {service.name}
                        </Text>
                        {service.description && (
                          <Text style={styles.serviceDescription} numberOfLines={2}>
                            {service.description}
                          </Text>
                        )}
                        <View style={styles.serviceMeta}>
                          <Text style={styles.servicePrice}>{service.price} MAD</Text>
                          <Text style={styles.serviceDuration}>{service.duration_minutes} min</Text>
                        </View>
                      </View>

                      {/* Arrow */}
                      <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stars: {
    color: '#FFD700',
    fontSize: 16,
  },
  ratingValue: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.fontSize.base,
  },
  reviewCount: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.fontSize.sm,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  bioText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  customServicesList: {
    gap: spacing.md,
  },
  customServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  serviceImage: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[200],
  },
  serviceImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  servicePrice: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.primary,
  },
  serviceDuration: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
});
