/**
 * Provider Onboarding - Selection des services
 * Page affichee apres inscription pour selectionner les services proposes
 * Utilise l'API pour recuperer les vrais IDs des services
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography, borderRadius, shadows } from "../../src/lib/constants/theme";
import { addProviderServices, getProviderServices } from "../../src/lib/api";
import { getServices, getCategories } from "../../src/lib/api/servicesAPI";
import { Service, Category } from "../../src/types/service";
import Button from "../../src/components/ui/Button";
import { hapticFeedback } from "../../src/lib/utils/haptics";

export default function ProviderOnboardingScreen() {
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [initialServices, setInitialServices] = useState<number[]>([]); // Services deja enregistres
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API data
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Charger les services, categories et services existants du prestataire
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Debug: verifier le token avant de charger
        const { getToken } = await import("../../src/lib/api/client");
        const token = await getToken();
        console.log('[Onboarding] Token disponible:', token ? token.substring(0, 30) + '...' : 'AUCUN');

        if (!token) {
          console.error('[Onboarding] Pas de token! Redirection vers login.');
          setLoadError("Session non valide. Veuillez vous reconnecter.");
          return;
        }

        // Charger en parallele: services, categories et services du prestataire
        const [servicesRes, categoriesRes, providerServicesRes] = await Promise.all([
          getServices(),
          getCategories(),
          getProviderServices().catch((error) => {
            console.warn('[Onboarding] getProviderServices error:', error?.response?.status, error?.message);
            return [];
          }),
        ]);

        setServices(servicesRes.data || []);
        setCategories(categoriesRes || []);

        // Pre-selectionner les services deja enregistres
        if (providerServicesRes && providerServicesRes.length > 0) {
          const existingServiceIds = providerServicesRes.map(
            (ps: any) => Number(ps.service_id || ps.id)
          );
          setSelectedServices(existingServiceIds);
          setInitialServices(existingServiceIds); // Garder en memoire les services initiaux
          console.log('[Onboarding] Services existants:', existingServiceIds);
        }

        // Expand first category by default
        if (categoriesRes && categoriesRes.length > 0) {
          setExpandedCategories([Number(categoriesRes[0].id)]);
        }
      } catch (error: any) {
        console.error("Erreur chargement services:", error);
        setLoadError("Impossible de charger les services. Verifiez votre connexion.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper pour obtenir les services par categorie
  const getServicesByCategory = (categoryId: number): Service[] => {
    return services.filter(s => {
      const sCatId = typeof s.category_id === 'string' ? parseInt(s.category_id, 10) : s.category_id;
      return sCatId === categoryId;
    });
  };

  const toggleCategory = (categoryId: number) => {
    hapticFeedback.selection();
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const toggleService = (serviceId: number) => {
    hapticFeedback.selection();
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      }
      return [...prev, serviceId];
    });
  };

  const selectAllInCategory = (categoryId: number) => {
    hapticFeedback.medium();
    const categoryServices = getServicesByCategory(categoryId);
    const serviceIds = categoryServices.map(s => Number(s.id));

    // Check if all are already selected
    const allSelected = serviceIds.every(id => selectedServices.includes(id));

    if (allSelected) {
      // Deselect all
      setSelectedServices(prev => prev.filter(id => !serviceIds.includes(id)));
    } else {
      // Select all
      setSelectedServices(prev => [...new Set([...prev, ...serviceIds])]);
    }
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      Alert.alert(
        "Aucun service selectionne",
        "Veuillez selectionner au moins un service pour continuer."
      );
      return;
    }

    // Filtrer pour n'ajouter que les nouveaux services
    const newServices = selectedServices.filter(id => !initialServices.includes(id));

    setIsSubmitting(true);
    hapticFeedback.medium();

    // Debug: verifier le token avant d'ajouter
    const { getToken } = await import("../../src/lib/api/client");
    const token = await getToken();
    console.log('[Onboarding] handleSubmit - Token:', token ? token.substring(0, 30) + '...' : 'AUCUN');

    if (!token) {
      setIsSubmitting(false);
      Alert.alert(
        "Session expirée",
        "Veuillez vous reconnecter.",
        [{ text: "OK", onPress: () => router.replace('/auth/login' as any) }]
      );
      return;
    }

    try {
      // Ajouter uniquement les nouveaux services
      if (newServices.length > 0) {
        console.log('[Onboarding] Ajout de', newServices.length, 'services:', newServices);
        await addProviderServices(newServices);
        console.log('[Onboarding] Nouveaux services ajoutes avec succes');
      }

      hapticFeedback.success();

      const message = newServices.length > 0
        ? `${newServices.length} nouveau(x) service(s) ajoute(s). Total: ${selectedServices.length} service(s).`
        : `${selectedServices.length} service(s) deja enregistre(s).`;

      Alert.alert(
        "Services enregistres !",
        message,
        [
          {
            text: "Continuer",
            onPress: () => router.replace("/(provider)" as any),
          },
        ]
      );
    } catch (error: any) {
      console.error("Erreur ajout services:", error);
      hapticFeedback.error();
      Alert.alert(
        "Erreur",
        error?.message || "Impossible d'enregistrer les services. Reessayez."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Passer cette etape ?",
      "Vous pourrez ajouter vos services plus tard depuis votre profil.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Passer",
          onPress: () => router.replace("/(provider)" as any),
        },
      ]
    );
  };

  const getSelectedCountForCategory = (categoryId: number) => {
    const categoryServices = getServicesByCategory(categoryId);
    return categoryServices.filter(s => selectedServices.includes(Number(s.id))).length;
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{loadError}</Text>
          <Button
            variant="primary"
            size="md"
            onPress={() => {
              setIsLoading(true);
              setLoadError(null);
              // Retry loading
              Promise.all([getServices(), getCategories()])
                .then(([servicesRes, categoriesRes]) => {
                  setServices(servicesRes.data || []);
                  setCategories(categoriesRes || []);
                })
                .catch(() => setLoadError("Erreur de connexion"))
                .finally(() => setIsLoading(false));
            }}
          >
            Reessayer
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Selectionnez vos services</Text>
        <Text style={styles.subtitle}>
          Choisissez les services que vous proposez a vos clients
        </Text>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionCount}>
            {selectedServices.length} service(s) selectionne(s)
          </Text>
        </View>
      </View>

      {/* Categories and Services */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((category) => {
          const catId = Number(category.id);
          const categoryServices = getServicesByCategory(catId);
          const isExpanded = expandedCategories.includes(catId);
          const selectedCount = getSelectedCountForCategory(catId);
          const allSelected = selectedCount === categoryServices.length && categoryServices.length > 0;

          // Mapper les icones textuelles vers des emojis
          const getEmoji = (icon: string | undefined, slug: string | undefined) => {
            const iconMap: Record<string, string> = {
              'home': '🏠', 'house': '🏠', 'maison': '🏠',
              'spa': '💆', 'wellness': '💆', 'bien-etre': '🧘',
              'car': '🚗', 'auto': '🚗', 'voiture': '🚗',
              'paw': '🐕', 'pets': '🐕', 'animaux': '🐕',
              'scissors': '💇', 'cut': '💇', 'coiffure': '💇',
              'beauty': '💄', 'beaute': '💄',
              'brush': '💄', 'makeup': '💅',
            };
            const key = icon?.toLowerCase() || slug?.toLowerCase() || '';
            return iconMap[key] || '📦';
          };

          const categoryEmoji = getEmoji(category.icon, category.slug);

          return (
            <View key={category.id} style={styles.categorySection}>
              {/* Category Header */}
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(catId)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryIcon}>{categoryEmoji}</Text>
                  <View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>
                      {categoryServices.length} services disponibles
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  {selectedCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: category.color || colors.primary }]}>
                      <Text style={styles.badgeText}>{selectedCount}</Text>
                    </View>
                  )}
                  <Text style={styles.expandIcon}>
                    {isExpanded ? "▼" : "▶"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Services List */}
              {isExpanded && (
                <View style={styles.servicesList}>
                  {/* Select All Button */}
                  {categoryServices.length > 0 && (
                    <TouchableOpacity
                      style={styles.selectAllButton}
                      onPress={() => selectAllInCategory(catId)}
                    >
                      <Text style={styles.selectAllText}>
                        {allSelected ? "Tout desélectionner" : "Tout selectionner"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {categoryServices.length === 0 ? (
                    <Text style={styles.emptyText}>Aucun service dans cette categorie</Text>
                  ) : (
                    categoryServices.map((service) => {
                      const serviceId = Number(service.id);
                      const isSelected = selectedServices.includes(serviceId);

                      return (
                        <TouchableOpacity
                          key={service.id}
                          style={[
                            styles.serviceItem,
                            isSelected && styles.serviceItemSelected,
                          ]}
                          onPress={() => toggleService(serviceId)}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{ uri: service.images?.[0] || service.thumbnail }}
                            style={styles.serviceImage}
                          />
                          <View style={styles.serviceInfo}>
                            <Text style={styles.serviceTitle} numberOfLines={1}>
                              {service.title || service.name}
                            </Text>
                            <Text style={styles.serviceDescription} numberOfLines={2}>
                              {service.description}
                            </Text>
                            <View style={styles.serviceMeta}>
                              <Text style={styles.servicePrice}>
                                {service.price} MAD
                              </Text>
                              {service.duration_minutes && (
                                <Text style={styles.serviceDuration}>
                                  {service.duration_minutes} min
                                </Text>
                              )}
                            </View>
                          </View>
                          <View style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                          ]}>
                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isSubmitting}
        >
          <Text style={styles.skipButtonText}>Passer</Text>
        </TouchableOpacity>

        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || selectedServices.length === 0}
          style={styles.submitButton}
        >
          {isSubmitting
            ? "Enregistrement..."
            : `Valider (${selectedServices.length})`}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: "center",
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: "center",
    paddingVertical: spacing.lg,
    fontStyle: "italic",
  },
  header: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "bold",
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  selectionInfo: {
    marginTop: spacing.md,
    backgroundColor: colors.primary + "10",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  selectionCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },

  // Category
  categorySection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.gray[900],
  },
  categoryCount: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: "bold",
  },
  expandIcon: {
    fontSize: 12,
    color: colors.gray[500],
  },

  // Services List
  servicesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  selectAllButton: {
    alignSelf: "flex-end",
    marginBottom: spacing.sm,
  },
  selectAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },

  // Service Item
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  serviceItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "05",
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[200],
  },
  serviceInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  serviceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.gray[900],
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    lineHeight: 16,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  servicePrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: "bold",
    color: colors.primary,
  },
  serviceDuration: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },

  // Checkbox
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
    ...shadows.lg,
  },
  skipButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  skipButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    fontWeight: "500",
  },
  submitButton: {
    flex: 1,
  },
});
