/**
 * Provider Profile - GlamGo Mobile
 * Profil complet du prestataire avec stats, services et switch mode
 * Design moderne et elegant
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { selectUser, logoutUser, resetAuth } from '../../src/lib/store/slices/authSlice';
import { persistor } from '../../src/lib/store';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import {
  getProviderProfile,
  getProviderServices,
  getProviderEarnings,
  getProviderFormulas,
  BookingFormula,
} from '../../src/lib/api/providerAPI';
import { API_BASE_URL } from '../../src/lib/api/client';
import { appEvents, EVENTS } from '../../src/lib/utils/eventEmitter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Stats initiales pour nouveau prestataire
const INITIAL_STATS = {
  rating: 0,
  reviews_count: 0,
  services_count: 0,
  completed_bookings: 0,
  earnings_total: 0,
  completion_rate: 0,
  response_time: '-',
  is_verified: false,
  joined_date: new Date().toISOString(),
};

interface ProviderService {
  id: number;
  title: string;
  price: number;
  duration: number;
  description?: string;
  active: boolean;
  image?: string;
}

export default function ProviderProfileScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [formulas, setFormulas] = useState<BookingFormula[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const initialLoadDone = useRef(false);

  // Charger les donnees depuis l'API
  const loadProfileData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setImageLoadError(false);
    try {
      const [profileData, servicesData, earningsData, formulasData] = await Promise.all([
        getProviderProfile().catch(() => null),
        getProviderServices().catch(() => []),
        getProviderEarnings().catch(() => ({ total: 0, net: 0, bookings: 0 })),
        getProviderFormulas().catch(() => []),
      ]);

      setFormulas(formulasData || []);

      if (profileData) {
        const photo = profileData.avatar
          || profileData.profile_image
          || (profileData as any).photo
          || (profileData as any).profile_photo
          || (profileData as any).image_url
          || null;

        if (photo) {
          const fullPhotoUrl = photo.startsWith('http')
            ? photo
            : `${API_BASE_URL}${photo}`;
          setProfilePhoto(fullPhotoUrl);
        }

        setStats({
          rating: profileData.average_rating || profileData.rating || 0,
          reviews_count: profileData.total_reviews || 0,
          services_count: servicesData?.length || 0,
          completed_bookings: earningsData.bookings || 0,
          earnings_total: earningsData.net || 0,
          completion_rate: (profileData as any).completion_rate || 95,
          response_time: '< 4 min',
          is_verified: profileData.is_verified || false,
          joined_date: profileData.created_at || new Date().toISOString(),
        });
      }

      if (servicesData && servicesData.length > 0) {
        const formattedServices: ProviderService[] = servicesData.map((s: any) => {
          // Construire l'URL de l'image
          let imageUrl = s.image || s.service?.image || s.service?.thumbnail || null;
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${API_BASE_URL}${imageUrl}`;
          }
          return {
            id: s.id,
            title: s.name || s.service?.title || s.title || 'Service',
            price: parseFloat(s.price) || s.custom_price || s.service?.base_price || 0,
            duration: s.duration_minutes || s.custom_duration || s.service?.duration_minutes || 0,
            description: s.description || s.service?.description || null,
            active: s.is_active !== false,
            image: imageUrl,
          };
        });
        setServices(formattedServices);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Recharger les donnees a chaque focus (sync avec tab services)
  // Chargement initial avec loader
  // Chargement initial avec loader
  useEffect(() => {
    loadProfileData(true).then(() => {
      initialLoadDone.current = true;
    });
  }, []);

  // Recharger les donnees a chaque focus (sync avec tab services)
  useEffect(() => {
    if (isFocused && initialLoadDone.current) {
      console.log("[Profile] Screen focused - reloading services count");
      loadProfileData(false);
    }
  }, [isFocused]);

  // Ecouter les evenements de mise a jour des services
  useEffect(() => {
    const unsubscribe = appEvents.on(EVENTS.REFRESH_PROVIDER_SERVICES, () => {
      console.log("[Profile] Services updated event received - reloading");
      // Ajouter un petit delai pour s'assurer que le backend a fini de traiter
      setTimeout(() => {
        loadProfileData(false);
      }, 300);
    });
    return unsubscribe;
  }, [loadProfileData]);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticFeedback.light();
    await loadProfileData(false);
  };

  const handleLogout = () => {
    hapticFeedback.warning();
    console.log('[Provider Profile] handleLogout called');
    Alert.alert(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Deconnexion',
          style: 'destructive',
          onPress: async () => {
            console.log('[Provider Profile] Logout confirmed, calling logoutUser...');
            // IMPORTANT: Appeler logoutUser() EN PREMIER pour notifier le backend
            // Cela met le prestataire hors ligne automatiquement
            try {
              await dispatch(logoutUser()).unwrap();
              console.log('[Provider Profile] logoutUser completed');
            } catch (e) {
              console.error('[Provider Profile] logoutUser error:', e);
            }
            // Ensuite nettoyer l'état local
            dispatch(resetAuth());
            await persistor.flush();
            await persistor.purge();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handleManageServices = () => {
    hapticFeedback.light();
    router.push('/(provider)/services' as any);
  };

  const handleEditProfile = () => {
    hapticFeedback.light();
    router.push('/edit-profile' as any);
  };

  const handleHelp = () => {
    hapticFeedback.light();
    Alert.alert(
      'Aide & Support',
      'Comment pouvons-nous vous aider ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => {
            const subject = encodeURIComponent('Aide Prestataire GlamGo');
            const body = encodeURIComponent(`Bonjour,\n\nJ'ai besoin d'aide concernant...\n\nMerci.`);
            router.push(`mailto:support@glamgo.ma?subject=${subject}&body=${body}` as any);
          },
        },
        {
          text: 'Appeler',
          onPress: () => router.push('tel:+212600000000' as any),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.name || 'Prestataire';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header avec gradient */}
      <LinearGradient
        colors={[colors.primary, '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Edit button */}
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Modifier</Text>
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarContainer}>
            {(profilePhoto || user?.avatar) && !imageLoadError ? (
              <Image
                source={{ uri: profilePhoto || user?.avatar }}
                style={styles.avatar}
                onError={() => setImageLoadError(true)}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          {stats.is_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </LinearGradient>

      {/* Stats Cards - Floating */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statValue}>{Number(stats.rating || 0).toFixed(1)}</Text>
          <Text style={styles.statLabel}>{stats.reviews_count} avis</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📅</Text>
          <Text style={styles.statValue}>{stats.completed_bookings}</Text>
          <Text style={styles.statLabel}>Reservations</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⚡</Text>
          <Text style={styles.statValueSmall}>{'< 4 min'}</Text>
          <Text style={styles.statLabel}>Reponse</Text>
        </View>
      </View>

      {/* Revenus */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/(provider)/earnings' as any)}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.earningsCard}
        >
          <View style={styles.earningsLeft}>
            <Text style={styles.earningsLabel}>Revenus totaux</Text>
            <Text style={styles.earningsTotal}>
              {(stats.earnings_total || 0).toLocaleString()} DH
            </Text>
          </View>
          <View style={styles.earningsRight}>
            <Text style={styles.earningsArrow}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Mes Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Services</Text>
          <TouchableOpacity onPress={handleManageServices}>
            <Text style={styles.sectionLink}>Gerer</Text>
          </TouchableOpacity>
        </View>

        {services.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💼</Text>
            <Text style={styles.emptyTitle}>Aucun service configure</Text>
            <Text style={styles.emptySubtext}>
              Ajoutez vos services pour recevoir des reservations
            </Text>
            <Button
              variant="primary"
              size="sm"
              onPress={handleManageServices}
              style={styles.emptyButton}
            >
              Ajouter des services
            </Button>
          </View>
        ) : (
          <View style={styles.servicesCard}>
            {services.slice(0, 4).map((service, index) => (
              <View
                key={service.id}
                style={[
                  styles.serviceItem,
                  index === Math.min(services.length - 1, 3) && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.serviceImageContainer}>
                  {service.image ? (
                    <Image
                      source={{ uri: service.image }}
                      style={styles.serviceImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.serviceImagePlaceholder}>
                      <Text style={styles.serviceIcon}>✨</Text>
                    </View>
                  )}
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName} numberOfLines={1}>{service.title}</Text>
                  {service.duration > 0 && (
                    <Text style={styles.serviceDuration}>{service.duration} min</Text>
                  )}
                </View>
                <Text style={styles.servicePrice}>{service.price} DH</Text>
                <View style={[
                  styles.serviceStatus,
                  { backgroundColor: service.active ? colors.success + '20' : colors.gray[200] }
                ]}>
                  <View style={[
                    styles.serviceStatusDot,
                    { backgroundColor: service.active ? colors.success : colors.gray[400] }
                  ]} />
                </View>
              </View>
            ))}
            {services.length > 4 && (
              <TouchableOpacity style={styles.seeMoreButton} onPress={handleManageServices}>
                <Text style={styles.seeMoreText}>Voir les {services.length - 4} autres services →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Mes Formules */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Formules</Text>
          <TouchableOpacity onPress={() => {
            hapticFeedback.light();
            router.push('/(provider)/formulas' as any);
          }}>
            <Text style={styles.sectionLink}>Gerer</Text>
          </TouchableOpacity>
        </View>

        {formulas.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Aucune formule selectionnee</Text>
            <Text style={styles.emptySubtext}>
              Ajoutez des formules pour apparaitre dans les recherches clients
            </Text>
            <Button
              variant="primary"
              size="sm"
              onPress={() => {
                hapticFeedback.light();
                router.push('/(provider)/formulas' as any);
              }}
              style={styles.emptyButton}
            >
              Ajouter des formules
            </Button>
          </View>
        ) : (
          <View style={styles.formulasRow}>
            {formulas.slice(0, 5).map((formula) => (
              <View key={formula.id} style={styles.formulaChip}>
                <Text style={styles.formulaChipIcon}>{formula.icon}</Text>
                <Text style={styles.formulaChipText}>{formula.name}</Text>
                {formula.badge_text && (
                  <View style={[styles.formulaChipBadge, { backgroundColor: formula.badge_color || colors.primary }]}>
                    <Text style={styles.formulaChipBadgeText}>{formula.badge_text}</Text>
                  </View>
                )}
              </View>
            ))}
            {formulas.length > 5 && (
              <TouchableOpacity
                style={styles.formulaChipMore}
                onPress={() => {
                  hapticFeedback.light();
                  router.push('/(provider)/formulas' as any);
                }}
              >
                <Text style={styles.formulaChipMoreText}>+{formulas.length - 5}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Services Personnalisés */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Services Personnalises</Text>
          <TouchableOpacity onPress={() => {
            hapticFeedback.light();
            router.push('/(provider)/custom-services' as any);
          }}>
            <Text style={styles.sectionLink}>Gerer</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.customServicesCard}
          onPress={() => {
            hapticFeedback.light();
            router.push('/(provider)/custom-services' as any);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.customServicesIcon}>
            <Text style={styles.customServicesEmoji}>✨</Text>
          </View>
          <View style={styles.customServicesInfo}>
            <Text style={styles.customServicesTitle}>Creez vos propres services</Text>
            <Text style={styles.customServicesSubtext}>
              Proposez des prestations uniques a vos clients
            </Text>
          </View>
          <Text style={styles.customServicesArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceCard}>
          <View style={styles.performanceItem}>
            <View style={styles.performanceLeft}>
              <Text style={styles.performanceIcon}>📊</Text>
              <Text style={styles.performanceLabel}>Taux de completion</Text>
            </View>
            <View style={styles.performanceRight}>
              <Text style={styles.performanceValue}>{stats.completion_rate}%</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${stats.completion_rate}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.performanceItem}>
            <View style={styles.performanceLeft}>
              <Text style={styles.performanceIcon}>⏱️</Text>
              <Text style={styles.performanceLabel}>Temps de reponse</Text>
            </View>
            <Text style={styles.performanceValueHighlight}>{stats.response_time}</Text>
          </View>

          <View style={styles.performanceItem}>
            <View style={styles.performanceLeft}>
              <Text style={styles.performanceIcon}>✅</Text>
              <Text style={styles.performanceLabel}>Services actifs</Text>
            </View>
            <Text style={styles.performanceValue}>
              {services.filter(s => s.active).length}/{services.length}
            </Text>
          </View>

          <View style={[styles.performanceItem, { borderBottomWidth: 0 }]}>
            <View style={styles.performanceLeft}>
              <Text style={styles.performanceIcon}>📅</Text>
              <Text style={styles.performanceLabel}>Membre depuis</Text>
            </View>
            <Text style={styles.performanceValue}>
              {stats.joined_date
                ? new Date(stats.joined_date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'short',
                  })
                : '-'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={handleEditProfile}>
            <View style={[styles.quickActionIconBg, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.quickActionIcon}>✏️</Text>
            </View>
            <Text style={styles.quickActionLabel}>Modifier profil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => {
              hapticFeedback.light();
              router.push('/settings' as any);
            }}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: '#8B5CF6' + '15' }]}>
              <Text style={styles.quickActionIcon}>⚙️</Text>
            </View>
            <Text style={styles.quickActionLabel}>Parametres</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={handleHelp}>
            <View style={[styles.quickActionIconBg, { backgroundColor: colors.success + '15' }]}>
              <Text style={styles.quickActionIcon}>💬</Text>
            </View>
            <Text style={styles.quickActionLabel}>Aide</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={handleLogout}>
            <View style={[styles.quickActionIconBg, { backgroundColor: colors.error + '15' }]}>
              <Text style={styles.quickActionIcon}>🚪</Text>
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.error }]}>Deconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>GlamGo Pro v1.0.0</Text>
        <Text style={styles.appMode}>Mode Prestataire</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },

  // Header Gradient
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  editButton: {
    position: 'absolute',
    top: 50,
    right: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  editButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    padding: 4,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  verifiedIcon: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  email: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.sm,
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: -30,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  statValueSmall: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.success,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },

  // Earnings Card
  earningsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsLeft: {},
  earningsLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  earningsTotal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  earningsRight: {},
  earningsArrow: {
    fontSize: 24,
    color: colors.white,
    opacity: 0.8,
  },

  // Sections
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
  },
  sectionLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },

  // Services
  servicesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  serviceImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  serviceImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  serviceImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIcon: {
    fontSize: 18,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  serviceDuration: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  servicePrice: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: spacing.md,
  },
  serviceStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  seeMoreButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  seeMoreText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },

  // Empty State
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {},

  // Performance
  performanceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  performanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  performanceIcon: {
    fontSize: 20,
  },
  performanceLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  performanceRight: {
    alignItems: 'flex-end',
  },
  performanceValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  performanceValueHighlight: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.success,
  },
  progressBarContainer: {
    width: 60,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIconBg: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
  },

  // App Info
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  appVersion: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[400],
  },
  appMode: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },

  // Formulas
  formulasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  formulaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  formulaChipIcon: {
    fontSize: 16,
  },
  formulaChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  formulaChipBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    marginLeft: 2,
  },
  formulaChipBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  formulaChipMore: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formulaChipMoreText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[600],
  },

  // Custom Services
  customServicesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  customServicesIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customServicesEmoji: {
    fontSize: 24,
  },
  customServicesInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customServicesTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  customServicesSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  customServicesArrow: {
    fontSize: 20,
    color: colors.gray[400],
  },
});
