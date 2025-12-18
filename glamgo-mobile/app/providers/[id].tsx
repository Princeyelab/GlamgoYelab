/**
 * Provider Detail Screen - GlamGo Mobile
 * Affiche les details complets d'un prestataire
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import Card from '../../src/components/ui/Card';
import ServiceCard from '../../src/components/features/ServiceCard';
import Loading from '../../src/components/ui/Loading';
import { colors, spacing, typography, shadows, borderRadius } from '../../src/lib/constants/theme';
import { useAppSelector } from '../../src/lib/store/hooks';
import { selectServices } from '../../src/lib/store/slices/servicesSlice';
import { Service } from '../../src/types/service';

const { width } = Dimensions.get('window');

// Type pour le provider
interface Provider {
  id: number | string;
  name: string;
  company_name?: string;
  avatar?: string;
  rating?: number;
  reviews_count?: number;
  services_count?: number;
  completed_bookings_count?: number;
  is_verified?: boolean;
  is_available?: boolean;
  bio?: string;
  business_type?: 'company' | 'individual';
  city?: string;
  joined_date?: string;
  categories?: string[];
}

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const services = useAppSelector(selectServices);

  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'about'>('services');

  useEffect(() => {
    loadProvider();
  }, [id]);

  const loadProvider = async () => {
    try {
      // Extraire provider depuis services (simulation)
      // En production, on appellerait l'API
      const service = services.find(s =>
        s.provider?.id === Number(id) || s.provider_id === Number(id)
      );

      if (service?.provider) {
        setProvider({
          id: service.provider.id,
          name: service.provider.name || 'Prestataire',
          avatar: service.provider.avatar,
          rating: (service.provider as any).rating || 4.5,
          reviews_count: (service.provider as any).reviews_count || 12,
          services_count: services.filter(s =>
            s.provider?.id === Number(id) || s.provider_id === Number(id)
          ).length,
          completed_bookings_count: 45,
          is_verified: true,
          is_available: true,
          bio: 'Professionnel experimente avec plus de 5 ans d\'experience dans le domaine de la beaute et du bien-etre. Passionnee par mon metier, je m\'engage a offrir un service de qualite.',
          business_type: 'individual',
          city: 'Casablanca',
          joined_date: '2023-01-15',
          categories: ['Coiffure', 'Beaute', 'Soins'],
        });
      } else {
        // Provider par defaut pour demo
        setProvider({
          id: Number(id),
          name: 'Prestataire Demo',
          rating: 4.7,
          reviews_count: 24,
          services_count: 5,
          completed_bookings_count: 89,
          is_verified: true,
          is_available: true,
          bio: 'Professionnel experimente.',
          business_type: 'individual',
          city: 'Casablanca',
          joined_date: '2023-06-01',
          categories: ['Services'],
        });
      }
    } catch (error) {
      console.error('Error loading provider:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Chargement..." />;
  }

  if (!provider) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>Prestataire non trouve</Text>
        <Button variant="outline" onPress={() => router.back()}>
          Retour
        </Button>
      </View>
    );
  }

  // Services de ce provider
  const providerServices = services.filter(s =>
    s.provider?.id === Number(id) || s.provider_id === Number(id)
  );

  const handleServicePress = (serviceId: number | string) => {
    router.push(`/services/${serviceId}` as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {provider.avatar ? (
              <Image source={{ uri: provider.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {provider.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {provider.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <Text style={styles.name}>{provider.name}</Text>
          {provider.company_name && (
            <Text style={styles.company}>{provider.company_name}</Text>
          )}

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>⭐ {provider.rating?.toFixed(1)}</Text>
              <Text style={styles.statLabel}>{provider.reviews_count} avis</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{provider.services_count}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{provider.completed_bookings_count}</Text>
              <Text style={styles.statLabel}>Reservations</Text>
            </View>
          </View>

          {/* Availability Badge */}
          {provider.is_available ? (
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>✓ Disponible maintenant</Text>
            </View>
          ) : (
            <View style={[styles.availableBadge, styles.unavailableBadge]}>
              <Text style={[styles.availableBadgeText, styles.unavailableBadgeText]}>
                Occupe
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'services' && styles.tabActive]}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
              Services ({providerServices.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Avis ({provider.reviews_count})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
              A propos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Services Tab */}
          {activeTab === 'services' && (
            <View>
              {providerServices.length > 0 ? (
                providerServices.map((service: Service) => (
                  <View key={service.id} style={styles.serviceItem}>
                    <ServiceCard
                      id={service.id}
                      title={service.title}
                      description={service.description}
                      images={service.images}
                      thumbnail={service.thumbnail}
                      price={service.price}
                      currency={service.currency}
                      rating={service.rating}
                      reviews_count={service.reviews_count}
                      duration_minutes={service.duration_minutes}
                      category={service.category || { id: 0, name: 'Service' }}
                      provider={service.provider || { id: 0, name: 'Prestataire' }}
                      is_featured={service.is_featured}
                      onPress={() => handleServicePress(service.id)}
                    />
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>Aucun service disponible</Text>
                </View>
              )}
            </View>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⭐</Text>
              <Text style={styles.emptyTitle}>Avis clients</Text>
              <Text style={styles.emptyText}>
                Les avis seront affiches ici prochainement
              </Text>
            </View>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <Card style={styles.aboutCard}>
              {provider.bio && (
                <>
                  <Text style={styles.sectionTitle}>Biographie</Text>
                  <Text style={styles.bio}>{provider.bio}</Text>
                </>
              )}

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Informations</Text>

                {provider.business_type && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type</Text>
                    <Text style={styles.infoValue}>
                      {provider.business_type === 'company' ? 'Entreprise' : 'Independant'}
                    </Text>
                  </View>
                )}

                {provider.city && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ville</Text>
                    <Text style={styles.infoValue}>{provider.city}</Text>
                  </View>
                )}

                {provider.joined_date && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Membre depuis</Text>
                    <Text style={styles.infoValue}>
                      {new Date(provider.joined_date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </Text>
                  </View>
                )}
              </View>

              {provider.categories && provider.categories.length > 0 && (
                <View style={styles.categoriesSection}>
                  <Text style={styles.sectionTitle}>Categories</Text>
                  <View style={styles.categories}>
                    {provider.categories.map((cat: string, index: number) => (
                      <View key={index} style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <Button
          variant="outline"
          style={styles.bottomButtonOutline}
          onPress={() => {/* TODO: Contact */}}
        >
          💬 Contacter
        </Button>
        <Button
          variant="primary"
          style={styles.bottomButtonPrimary}
          onPress={() => {
            if (providerServices.length > 0) {
              router.push(`/services/${providerServices[0].id}` as any);
            }
          }}
        >
          Reserver
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.xl,
    backgroundColor: colors.gray[50],
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadows.md,
  },
  backIcon: {
    fontSize: 24,
    color: colors.gray[900],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.white,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  verifiedIcon: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  company: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },

  // Stats
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray[300],
  },

  // Availability Badge
  availableBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.lg,
  },
  availableBadgeText: {
    color: colors.success,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  unavailableBadge: {
    backgroundColor: colors.gray[200],
  },
  unavailableBadgeText: {
    color: colors.gray[600],
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Content
  content: {
    padding: spacing.lg,
  },
  serviceItem: {
    marginBottom: spacing.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
  },

  // About Card
  aboutCard: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  bio: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  infoSection: {
    marginTop: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    fontWeight: '500',
  },
  categoriesSection: {
    marginTop: spacing.lg,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryBadgeText: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    ...shadows.lg,
  },
  bottomButtonOutline: {
    flex: 1,
    marginRight: spacing.sm,
  },
  bottomButtonPrimary: {
    flex: 1,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
