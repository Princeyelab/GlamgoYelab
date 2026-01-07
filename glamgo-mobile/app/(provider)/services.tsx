/**
 * Provider Services Management - GlamGo Mobile
 * Gestion des services proposés par le prestataire
 * Design moderne avec gradient header et cartes élégantes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { getImageUrl } from '../../src/lib/api/endpoints';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import { appEvents, EVENTS } from '../../src/lib/utils/eventEmitter';
import {
  getProviderServices,
  removeProviderService,
  ProviderService,
  getCustomServices,
  updateCustomService,
  deleteCustomService,
  CustomService,
} from '../../src/lib/api/providerAPI';
import useTranslation from '../../src/hooks/useTranslatedData';
import { getServiceTranslation } from '../../src/i18n/translations/services';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProviderServicesScreen() {
  const router = useRouter();
  const { t, translateService, language } = useTranslation();
  const [services, setServices] = useState<ProviderService[]>([]);
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);


  // Debug: log when services change
  useEffect(() => {
    console.log("[Services] services state changed, count:", services.length);
    console.log("[Services] custom services count:", customServices.length);
  }, [services, customServices]);

  const loadServices = useCallback(async (showLoader = true) => {
    console.log("[Services] loadServices called, showLoader:", showLoader);
    if (showLoader) setIsLoading(true);
    try {
      const [catalogData, customData] = await Promise.all([
        getProviderServices(),
        getCustomServices().catch(() => ({ services: [], count: 0, max_allowed: 10 })),
      ]);
      console.log("[Services] API returned", catalogData?.length || 0, "catalog services");
      console.log("[Services] API returned", customData?.services?.length || 0, "custom services");
      if (customData?.services?.length > 0) {
        console.log("[Services] First custom service:", JSON.stringify(customData.services[0], null, 2));
      }
      setServices(catalogData || []);
      setCustomServices(customData?.services || []);
    } catch (error) {
      console.error('Erreur chargement services:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices])
  );

  // Ecouter les evenements de mise a jour des services (depuis onboarding)
  useEffect(() => {
    const unsubscribe = appEvents.on(EVENTS.REFRESH_PROVIDER_SERVICES, () => {
      console.log("[Services] Services updated event received - reloading");
      // Petit delai pour s'assurer que le backend a fini de traiter
      setTimeout(() => {
        loadServices(false);
      }, 300);
    });
    return unsubscribe;
  }, [loadServices]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticFeedback.light();
    await loadServices(false);
  };

  const handleAddServices = () => {
    hapticFeedback.light();
    router.push('/(provider)/onboarding' as any);
  };

  const handleAddCustomService = () => {
    hapticFeedback.light();
    router.push('/(provider)/custom-services' as any);
  };

  // Toggle custom service active status
  const handleToggleCustomService = async (service: CustomService) => {
    // S'assurer que is_active est un booléen propre
    const currentActive = service.is_active === true || service.is_active === 1 || service.is_active === '1';
    const newActive = !currentActive;
    const payload = { is_active: newActive };
    console.log('[Services] Toggle custom service:', service.id);
    console.log('[Services] Current is_active raw:', service.is_active, 'type:', typeof service.is_active);
    console.log('[Services] Payload:', JSON.stringify(payload));
    try {
      const updated = await updateCustomService(service.id, payload);
      console.log('[Services] Toggle success, new is_active:', updated.is_active);
      hapticFeedback.selection();
      setCustomServices(prev =>
        prev.map(s => (s.id === service.id ? { ...s, is_active: updated.is_active } : s))
      );
      appEvents.emit(EVENTS.REFRESH_PROVIDER_SERVICES);
    } catch (error: any) {
      console.error('[Services] Toggle custom service error:', error);
      console.error('[Services] Error response:', error?.response?.data);
      Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de modifier le statut');
    }
  };

  // Edit custom service - navigate to custom-services page
  const handleEditCustomService = (service: CustomService) => {
    hapticFeedback.light();
    // Navigate to custom-services page (the edit modal is there)
    router.push('/(provider)/custom-services' as any);
  };

  // Delete custom service
  const handleDeleteCustomService = (service: CustomService) => {
    const translatedName = getServiceTranslation(service.name, language).title;
    console.log('[Services] Delete custom service requested:', service.id, service.name);
    Alert.alert(
      t('customServices.delete'),
      t('customServices.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            hapticFeedback.medium();
            try {
              console.log('[Services] Deleting custom service id:', service.id, 'type:', typeof service.id);
              // S'assurer que l'ID est un nombre
              const serviceId = Number(service.id);
              if (!serviceId || isNaN(serviceId)) {
                throw new Error('ID de service invalide');
              }
              await deleteCustomService(serviceId);
              console.log('[Services] Delete success');
              setCustomServices(prev => prev.filter(s => s.id !== service.id));
              appEvents.emit(EVENTS.REFRESH_PROVIDER_SERVICES);
              hapticFeedback.success();
            } catch (error: any) {
              console.error('[Services] Delete custom service error:', error);
              console.error('[Services] Error response:', error?.response?.data);
              hapticFeedback.error();
              Alert.alert(t('common.error'), error?.response?.data?.message || t('customServices.deleteError'));
            }
          },
        },
      ]
    );
  };

  const totalServices = services.length + customServices.length;
  const activeServices = services.filter(s => s.is_active).length + customServices.filter(s => s.is_active).length;
  const inactiveServices = totalServices - activeServices;

  const handleDeleteService = async (service: ProviderService) => {
    const serviceName = (service as any).name || service.service?.title || 'ce service';

    // Debug: voir la structure complète du service
    console.log('[Services] Full service object:', JSON.stringify(service, null, 2));

    // L'API peut retourner service_id directement ou dans service.id
    // Essayer plusieurs chemins possibles
    const serviceId = service.service_id
      || (service as any).service?.id
      || service.id;

    console.log('[Services] Delete requested for:', {
      provider_service_id: service.id,
      service_id: service.service_id,
      nested_service_id: (service as any).service?.id,
      using: serviceId,
      name: serviceName
    });

    Alert.alert(
      t('customServices.delete'),
      t('customServices.confirmRemoveFromCatalog'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            hapticFeedback.medium();
            try {
              console.log('[Services] Removing service_id:', serviceId);
              await removeProviderService(serviceId);
              console.log('[Services] Service removed successfully');

              // Mise à jour locale immédiate
              setServices(prev => prev.filter(s => s.service_id !== serviceId));

              // Notifier les autres écrans
              appEvents.emit(EVENTS.REFRESH_PROVIDER_SERVICES);

              hapticFeedback.success();
            } catch (error: any) {
              console.error('[Services] Delete failed:', error?.response?.data || error);
              hapticFeedback.error();
              Alert.alert(t('common.error'), t('customServices.deleteError'));
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LinearGradient
          colors={[colors.primary, '#8B5CF6']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color={colors.white} />
        </LinearGradient>
        <Text style={styles.loadingText}>{t('loadingMessages.services')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.primary, '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('providerProfile.myServices')}</Text>
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={handleAddServices}
          >
            <Text style={styles.addHeaderIcon}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          {t('providerProfile.manageServices')}
        </Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.statIconBg}
            >
              <Text style={styles.statIcon}>💼</Text>
            </LinearGradient>
            <Text style={styles.statValue}>{totalServices}</Text>
            <Text style={styles.statLabel}>{t('common.total')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.statIconBg}
            >
              <Text style={styles.statIcon}>✅</Text>
            </LinearGradient>
            <Text style={styles.statValue}>{activeServices}</Text>
            <Text style={styles.statLabel}>{t('common.active')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.statIconBg}
            >
              <Text style={styles.statIcon}>⏸️</Text>
            </LinearGradient>
            <Text style={styles.statValue}>{inactiveServices}</Text>
            <Text style={styles.statLabel}>{t('common.inactive')}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        
        style={styles.scrollView}
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
        {/* Services List */}
        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={[colors.primary, '#8B5CF6']}
              style={styles.emptyIconGradient}
            >
              <Text style={styles.emptyIcon}>💼</Text>
            </LinearGradient>
            <Text style={styles.emptyTitle}>{t('providerProfile.noServicesConfigured')}</Text>
            <Text style={styles.emptyText}>
              {t('providerProfile.addServicesToReceive')}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddServices}
            >
              <LinearGradient
                colors={[colors.primary, '#8B5CF6']}
                style={styles.emptyButtonGradient}
              >
                <Text style={styles.emptyButtonText}>+ {t('providerProfile.addServices')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {services.map((service: any, index: number) => {
              const isActive = service.is_active;
              const price = parseFloat(service.price) || service.custom_price || service.service?.base_price || 0;
              const duration = service.duration_minutes || service.custom_duration || service.service?.duration_minutes || 0;
              const rawServiceName = service.name || service.service?.title || t('services.service');
              const translatedServiceData = getServiceTranslation(rawServiceName, language);
              const serviceName = translatedServiceData.title || rawServiceName;
              const serviceDesc = translatedServiceData.description || service.description || service.service?.description;
              // Récupérer l'image du service
              const serviceImage = service.image || service.service?.image || service.images?.[0] || service.service?.images?.[0];
              const imageUrl = serviceImage ? getImageUrl(serviceImage) : null;

              return (
                <View key={service.id} style={styles.serviceCard}>
                  {/* Status indicator */}
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: isActive ? colors.success : colors.gray[400] }
                  ]} />

                  <View style={styles.serviceContent}>
                    {/* Header */}
                    <View style={styles.serviceHeader}>
                      <View style={styles.serviceIconContainer}>
                        {imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.serviceImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <LinearGradient
                            colors={isActive
                              ? [colors.primary + '20', colors.primary + '10']
                              : [colors.gray[200], colors.gray[100]]
                            }
                            style={styles.serviceIconBg}
                          >
                            <Text style={styles.serviceIcon}>
                              {index % 4 === 0 ? '✂️' : index % 4 === 1 ? '💅' : index % 4 === 2 ? '💆' : '🏠'}
                            </Text>
                          </LinearGradient>
                        )}
                      </View>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{serviceName}</Text>
                        {serviceDesc && (
                          <Text style={styles.serviceDescription} numberOfLines={2}>
                            {serviceDesc}
                          </Text>
                        )}
                      </View>
                      <View style={[
                        styles.statusBadge,
                        isActive ? styles.statusBadgeActive : styles.statusBadgeInactive
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive
                        ]}>
                          {isActive ? t('common.active') : t('common.inactive')}
                        </Text>
                      </View>
                    </View>

                    {/* Details */}
                    <View style={styles.serviceDetails}>
                      <View style={styles.detailCard}>
                        <Text style={styles.detailLabel}>{t('services.price')}</Text>
                        <Text style={styles.detailValue}>{price} DH</Text>
                      </View>
                      <View style={styles.detailCard}>
                        <Text style={styles.detailLabel}>{t('services.duration')}</Text>
                        <Text style={styles.detailValue}>{duration} {t('common.min')}</Text>
                      </View>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteService(service)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️ {t('customServices.removeFromCatalog')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Custom Services Section */}
            {customServices.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>📦 {t('providerProfile.customServices')}</Text>
                  <Text style={styles.sectionCount}>{customServices.length}</Text>
                </View>

                {customServices.map((service) => {
                  const imageUrl = service.images?.[0] ? getImageUrl(service.images[0]) : null;
                  const translatedCustom = getServiceTranslation(service.name, language);
                  const customServiceName = translatedCustom.title || service.name;
                  const customServiceDesc = translatedCustom.description || service.description;

                  return (
                    <View key={`custom-${service.id}`} style={styles.serviceCard}>
                      <View style={[
                        styles.statusIndicator,
                        { backgroundColor: service.is_active ? colors.success : colors.gray[400] }
                      ]} />

                      <View style={styles.serviceContent}>
                        <View style={styles.serviceHeader}>
                          <View style={styles.serviceIconContainer}>
                            {imageUrl ? (
                              <Image
                                source={{ uri: imageUrl }}
                                style={styles.serviceImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <LinearGradient
                                colors={service.is_active
                                  ? [colors.primary + '20', colors.primary + '10']
                                  : [colors.gray[200], colors.gray[100]]
                                }
                                style={styles.serviceIconBg}
                              >
                                <Text style={styles.serviceIcon}>📦</Text>
                              </LinearGradient>
                            )}
                          </View>
                          <View style={styles.serviceInfo}>
                            <Text style={styles.serviceName}>{customServiceName}</Text>
                            {customServiceDesc && (
                              <Text style={styles.serviceDescription} numberOfLines={2}>
                                {customServiceDesc}
                              </Text>
                            )}
                          </View>
                          <View style={[
                            styles.statusBadge,
                            service.is_active ? styles.statusBadgeActive : styles.statusBadgeInactive
                          ]}>
                            <Text style={[
                              styles.statusBadgeText,
                              service.is_active ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive
                            ]}>
                              {service.is_active ? t('common.active') : t('common.inactive')}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.serviceDetails}>
                          <View style={styles.detailCard}>
                            <Text style={styles.detailLabel}>{t('services.price')}</Text>
                            <Text style={styles.detailValue}>{service.price} DH</Text>
                          </View>
                          <View style={styles.detailCard}>
                            <Text style={styles.detailLabel}>{t('services.duration')}</Text>
                            <Text style={styles.detailValue}>{service.duration_minutes} {t('common.min')}</Text>
                          </View>
                        </View>

                        {/* Action Buttons for Custom Services */}
                        <View style={styles.customServiceActions}>
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleToggleCustomService(service)}
                          >
                            <Text style={[styles.actionBtnText, { color: service.is_active ? colors.warning : colors.success }]}>
                              {service.is_active ? `⏸️ ${t('customServices.deactivate')}` : `▶️ ${t('customServices.activate')}`}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleEditCustomService(service)}
                          >
                            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                              ✏️ {t('common.edit')}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleDeleteCustomService(service)}
                          >
                            <Text style={[styles.actionBtnText, { color: colors.error }]}>
                              🗑️ {t('common.delete')}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {/* Add more button */}
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={handleAddServices}
            >
              <LinearGradient
                colors={[colors.gray[50], colors.gray[100]]}
                style={styles.addMoreGradient}
              >
                <View style={styles.addMoreIconWrapper}>
                  <LinearGradient
                    colors={[colors.primary, '#8B5CF6']}
                    style={styles.addMoreIconBg}
                  >
                    <Text style={styles.addMoreIcon}>+</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.addMoreText}>{t('customServices.addMore')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Add custom service button */}
            <TouchableOpacity
              style={[styles.addMoreBtn, { marginTop: spacing.sm }]}
              onPress={handleAddCustomService}
            >
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.addMoreGradient}
              >
                <View style={styles.addMoreIconWrapper}>
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.addMoreIconBg}
                  >
                    <Text style={styles.addMoreIcon}>📦</Text>
                  </LinearGradient>
                </View>
                <Text style={[styles.addMoreText, { color: '#92400E' }]}>{t('customServices.createCustom')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: colors.white,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.white,
  },
  addHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addHeaderIcon: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: spacing.sm,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.white,
  },

  // Service Card
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  statusIndicator: {
    width: 4,
  },
  serviceContent: {
    flex: 1,
    padding: spacing.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  serviceIconContainer: {
    marginRight: spacing.md,
  },
  serviceIconBg: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceImage: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: colors.gray[200],
  },
  serviceIcon: {
    fontSize: 24,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusBadgeActive: {
    backgroundColor: colors.success + '15',
  },
  statusBadgeInactive: {
    backgroundColor: colors.gray[200],
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  statusBadgeTextActive: {
    color: colors.success,
  },
  statusBadgeTextInactive: {
    color: colors.gray[600],
  },

  // Details
  serviceDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailCard: {
    flex: 1,
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 4,
  },
  detailValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Delete button
  deleteButton: {
    backgroundColor: colors.error + '10',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  deleteButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.error,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray[800],
  },
  sectionCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },

  // Custom service actions
  customServiceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },

  // Add more button
  addMoreBtn: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  addMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
  },
  addMoreIconWrapper: {},
  addMoreIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  addMoreText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[700],
  },
});
