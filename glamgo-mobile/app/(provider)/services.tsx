/**
 * Provider Services Management - GlamGo Mobile
 * Gestion des services proposés par le prestataire
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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import {
  getProviderServices,
  removeProviderService,
  ProviderService,
} from '../../src/lib/api/providerAPI';

export default function ProviderServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<ProviderService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadServices = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const data = await getProviderServices();
      setServices(data || []);
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticFeedback.light();
    await loadServices(false);
  };

  const handleRemoveService = (service: any) => {
    hapticFeedback.warning();
    const serviceName = service.name || service.service?.title || 'ce service';
    const providerServiceId = service.provider_service_id || service.id;

    Alert.alert(
      'Supprimer le service',
      `Voulez-vous vraiment supprimer "${serviceName}" de votre catalogue ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeProviderService(providerServiceId);
              hapticFeedback.success();
              loadServices(false);
            } catch (error) {
              hapticFeedback.error();
              Alert.alert('Erreur', 'Impossible de supprimer le service');
            }
          },
        },
      ]
    );
  };

  const handleAddServices = () => {
    hapticFeedback.light();
    // TODO: Navigate to service selection screen
    Alert.alert(
      'Ajouter des services',
      'Cette fonctionnalité sera bientôt disponible. Vous pourrez ajouter de nouveaux services à votre catalogue.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{'Chargement des services...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{'Mes Services'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{services.length}</Text>
            <Text style={styles.statLabel}>{'Services'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{services.filter(s => s.is_active).length}</Text>
            <Text style={styles.statLabel}>{'Actifs'}</Text>
          </View>
        </View>

        {/* Services List */}
        {services.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>{'💼'}</Text>
            <Text style={styles.emptyTitle}>{'Aucun service'}</Text>
            <Text style={styles.emptyText}>
              {'Ajoutez des services à votre catalogue pour recevoir des réservations'}
            </Text>
            <Button
              variant="primary"
              onPress={handleAddServices}
              style={styles.addButton}
            >
              {'Ajouter des services'}
            </Button>
          </Card>
        ) : (
          <>
            {services.map((service: any) => (
              <Card key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>
                      {service.name || service.service?.title || 'Service'}
                    </Text>
                    {service.description || service.service?.description ? (
                      <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description || service.service?.description}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.serviceStatus}>
                    <Text style={[
                      styles.statusBadge,
                      service.is_active ? styles.statusActive : styles.statusInactive
                    ]}>
                      {service.is_active ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>

                <View style={styles.serviceDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{'Prix'}</Text>
                    <Text style={styles.detailValue}>
                      {parseFloat(service.price) || service.custom_price || service.service?.base_price || 0}{' DH'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{'Durée'}</Text>
                    <Text style={styles.detailValue}>
                      {service.duration_minutes || service.custom_duration || service.service?.duration_minutes || 0}{' min'}
                    </Text>
                  </View>
                </View>

                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRemoveService(service)}
                  >
                    <Text style={styles.actionButtonTextDanger}>{'🗑️ Supprimer'}</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}

            <Button
              variant="outline"
              fullWidth
              onPress={handleAddServices}
              style={styles.addMoreButton}
            >
              {'+ Ajouter d\'autres services'}
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
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
  headerSpacer: {
    width: 40,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },

  // Empty state
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addButton: {
    marginTop: spacing.md,
  },

  // Service card
  serviceCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  serviceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  serviceName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  serviceDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    lineHeight: 20,
  },
  serviceStatus: {},
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    overflow: 'hidden',
  },
  statusActive: {
    backgroundColor: colors.success + '20',
    color: colors.success,
  },
  statusInactive: {
    backgroundColor: colors.gray[200],
    color: colors.gray[600],
  },

  // Service details
  serviceDetails: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  detailItem: {},
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },

  // Actions
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  actionButtonTextDanger: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },

  // Add more button
  addMoreButton: {
    marginTop: spacing.md,
  },
});
