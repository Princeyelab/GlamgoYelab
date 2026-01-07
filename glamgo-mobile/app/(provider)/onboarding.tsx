/**
 * Provider Onboarding - Sélection des services
 * Page affichée après inscription pour sélectionner les services proposés
 * Ensuite redirige vers la sélection des formules
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography, borderRadius, shadows } from "../../src/lib/constants/theme";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { getServiceTranslation, getCategoryTranslation } from "../../src/i18n/translations/services";
import { addProviderServices, getProviderServices, removeProviderService } from "../../src/lib/api";
import { appEvents, EVENTS } from "../../src/lib/utils/eventEmitter";
import { getProviderFormulas, uploadProviderDiploma, getProviderDiplomas } from "../../src/lib/api/providerAPI";
import { getServices, getCategories } from "../../src/lib/api/servicesAPI";
import { Service, Category } from "../../src/types/service";
import { hapticFeedback } from "../../src/lib/utils/haptics";
import { serviceRequiresDiploma, getRequiredDiplomaCategories, getDiplomaCategoryInfo, DIPLOMA_CATEGORIES, anyServiceRequiresDiploma } from "../../src/lib/utils/diplomaServices";
import * as ImagePicker from "expo-image-picker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Configuration des couleurs par catégorie
const CATEGORY_COLORS: Record<string, [string, string]> = {
  'coiffure': ['#EC4899', '#F472B6'],
  'beaute': ['#8B5CF6', '#A78BFA'],
  'bien-etre': ['#10B981', '#34D399'],
  'maison': ['#F59E0B', '#FBBF24'],
  'auto': ['#3B82F6', '#60A5FA'],
  'animaux': ['#EF4444', '#F87171'],
  'default': ['#6B7280', '#9CA3AF'],
};

export default function ProviderOnboardingScreen() {
  const router = useRouter();
  const { t, language, isRTL } = useLanguage();
  const scrollViewRef = useRef<ScrollView>(null);
  const diplomaSectionY = useRef<number>(0);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [initialServices, setInitialServices] = useState<number[]>([]);
  // Mapping service_id -> provider_service_id pour pouvoir supprimer
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Pour savoir si le prestataire a déjà des formules (skip la page formules)
  const [hasExistingFormulas, setHasExistingFormulas] = useState(false);

  // Diplômes par catégorie
  const [requiredDiplomaCategories, setRequiredDiplomaCategories] = useState<string[]>([]);
  const [diplomaFiles, setDiplomaFiles] = useState<Record<string, string>>({});
  const [diplomaFileNames, setDiplomaFileNames] = useState<Record<string, string>>({});
  const [existingDiplomas, setExistingDiplomas] = useState<Record<string, { file_path: string; file_name: string; is_verified: boolean }>>({});

  // API data
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Charger les services et catégories
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const { getToken } = await import("../../src/lib/api/client");
        const token = await getToken();

        if (!token) {
          setLoadError(t('providerOnboarding.sessionInvalid'));
          return;
        }

        const [servicesRes, categoriesRes, providerServicesRes, providerFormulasRes, providerDiplomasRes] = await Promise.all([
          getServices(),
          getCategories(),
          getProviderServices().catch(() => []),
          getProviderFormulas().catch(() => []),
          getProviderDiplomas().catch(() => ({})),
        ]);

        // Charger les diplômes existants
        console.log('[Onboarding] Diplomas API response:', JSON.stringify(providerDiplomasRes));
        if (providerDiplomasRes && Object.keys(providerDiplomasRes).length > 0) {
          console.log('[Onboarding] Provider has existing diplomas:', Object.keys(providerDiplomasRes));
          setExistingDiplomas(providerDiplomasRes);
        } else {
          console.log('[Onboarding] No existing diplomas found');
        }

        // Vérifier si le prestataire a déjà des formules
        if (providerFormulasRes && providerFormulasRes.length > 0) {
          console.log('[Onboarding] Provider has existing formulas:', providerFormulasRes.length);
          setHasExistingFormulas(true);
        }

        const allServices = servicesRes.data || [];
        setServices(allServices);
        setCategories(categoriesRes || []);

        // Log all available service IDs for debugging
        console.log('[Onboarding] All available services:', allServices.map((s: Service) => ({ id: s.id, title: s.title || s.name })));

        console.log('[Onboarding] Provider services response:', JSON.stringify(providerServicesRes, null, 2));

        if (providerServicesRes && providerServicesRes.length > 0) {
          const existingServiceIds: number[] = [];

          providerServicesRes.forEach((ps: any) => {
            // L'API retourne: id = provider_service_id, service_id = ID du service dans la table services
            // On doit utiliser service_id pour matcher avec les services affichés
            const serviceId = Number(ps.service_id || ps.id);
            console.log('[Onboarding] Provider service entry:', { ps_id: ps.id, service_id: ps.service_id, using: serviceId });
            if (serviceId) {
              existingServiceIds.push(serviceId);
            }
          });

          console.log('[Onboarding] Loaded existing service IDs:', existingServiceIds);

          setSelectedServices(existingServiceIds);
          setInitialServices(existingServiceIds);
        } else {
          console.log('[Onboarding] No existing services found');
        }

        if (categoriesRes && categoriesRes.length > 0) {
          setExpandedCategories([Number(categoriesRes[0].id)]);
        }
      } catch (error: any) {
        console.error("Erreur chargement services:", error);
        setLoadError(t('providerOnboarding.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Recharger les services du provider quand la page revient au focus
  const reloadProviderServices = useCallback(async () => {
    try {
      console.log('[Onboarding] Reloading provider services on focus...');
      const providerServicesRes = await getProviderServices().catch(() => []);

      if (providerServicesRes && providerServicesRes.length > 0) {
        const existingServiceIds: number[] = [];
        providerServicesRes.forEach((ps: any) => {
          const serviceId = Number(ps.service_id || ps.id);
          if (serviceId) {
            existingServiceIds.push(serviceId);
          }
        });
        console.log('[Onboarding] Refreshed provider services:', existingServiceIds);
        setSelectedServices(existingServiceIds);
        setInitialServices(existingServiceIds);
      } else {
        console.log('[Onboarding] No provider services found on refresh');
        setSelectedServices([]);
        setInitialServices([]);
      }
    } catch (error) {
      console.error('[Onboarding] Error reloading provider services:', error);
    }
  }, []);

  // Recharger quand la page revient au focus (ex: retour depuis services.tsx après suppression)
  useFocusEffect(
    useCallback(() => {
      // Ne pas recharger au premier mount (le useEffect principal s'en charge)
      if (!isLoading && services.length > 0) {
        reloadProviderServices();
      }
    }, [isLoading, services.length, reloadProviderServices])
  );

  // Vérifier quelles catégories de diplômes sont requises quand les services sélectionnés changent
  useEffect(() => {
    const selectedServiceNames = services
      .filter(s => selectedServices.includes(Number(s.id)))
      .map(s => s.title || s.name || "");

    console.log('[Onboarding] Selected service names:', selectedServiceNames);

    const categoriesSet = getRequiredDiplomaCategories(selectedServiceNames);
    const newCategories = Array.from(categoriesSet);
    console.log('[Onboarding] Required diploma categories:', newCategories);

    // Scroller vers la section diplôme si une nouvelle catégorie est ajoutée
    const hasNewDiplomaCategory = newCategories.some(cat => !requiredDiplomaCategories.includes(cat));
    if (hasNewDiplomaCategory && newCategories.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }

    setRequiredDiplomaCategories(newCategories);
  }, [selectedServices, services]);

  const getServicesByCategory = (categoryId: number): Service[] => {
    return services.filter(s => {
      const sCatId = typeof s.category_id === 'string' ? parseInt(s.category_id, 10) : s.category_id;
      return sCatId === categoryId;
    });
  };

  const getCategoryGradient = (slug?: string): [string, string] => {
    if (!slug) return CATEGORY_COLORS.default;
    const key = slug.toLowerCase();
    return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
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
    console.log('[Onboarding] toggleService called with serviceId:', serviceId);
    hapticFeedback.selection();
    setSelectedServices(prev => {
      console.log('[Onboarding] Previous selectedServices:', prev);
      if (prev.includes(serviceId)) {
        const newList = prev.filter(id => id !== serviceId);
        console.log('[Onboarding] Removing service, new list:', newList);
        return newList;
      }
      const newList = [...prev, serviceId];
      console.log('[Onboarding] Adding service, new list:', newList);
      return newList;
    });
  };

  const selectAllInCategory = (categoryId: number) => {
    hapticFeedback.medium();
    const categoryServices = getServicesByCategory(categoryId);
    const serviceIds = categoryServices.map(s => Number(s.id));
    const allSelected = serviceIds.every(id => selectedServices.includes(id));

    if (allSelected) {
      setSelectedServices(prev => prev.filter(id => !serviceIds.includes(id)));
    } else {
      setSelectedServices(prev => [...new Set([...prev, ...serviceIds])]);
    }
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      Alert.alert(
        t('providerOnboarding.noServiceSelected'),
        t('providerOnboarding.selectAtLeastOne')
      );
      return;
    }

    // Vérifier si tous les diplômes requis ont été fournis
    console.log('[Onboarding] Validation - Required categories:', requiredDiplomaCategories);
    console.log('[Onboarding] Validation - Existing diplomas:', Object.keys(existingDiplomas));
    console.log('[Onboarding] Validation - New diploma files:', Object.keys(diplomaFiles));

    const missingDiplomas = requiredDiplomaCategories.filter(
      cat => !diplomaFiles[cat] && !existingDiplomas[cat]
    );
    console.log('[Onboarding] Validation - Missing diplomas:', missingDiplomas);

    if (missingDiplomas.length > 0) {
      const missingNames = missingDiplomas.map(cat => {
        const info = getDiplomaCategoryInfo(cat);
        return info?.label?.[language] || info?.label?.fr || cat;
      }).join(", ");

      Alert.alert(
        t('providerOnboarding.diplomaRequired'),
        t('providerOnboarding.addDiplomas', { names: missingNames })
      );
      hapticFeedback.warning();
      return;
    }

    // Services à ajouter (nouveaux)
    const newServices = selectedServices.filter(id => !initialServices.includes(id));
    // Services à supprimer (désélectionnés)
    const removedServices = initialServices.filter(id => !selectedServices.includes(id));

    console.log('[Onboarding] === SUBMIT DEBUG ===');
    console.log('[Onboarding] Initial services (state):', initialServices);
    console.log('[Onboarding] Selected services (state):', selectedServices);
    console.log('[Onboarding] New services to add:', newServices);
    console.log('[Onboarding] Services to remove:', removedServices);
    console.log('[Onboarding] === END DEBUG ===');

    setIsSubmitting(true);
    hapticFeedback.medium();

    try {
      // Supprimer les services désélectionnés
      // Note: Le backend attend service_id dans l'URL, pas provider_service_id
      for (const serviceId of removedServices) {
        console.log('[Onboarding] Removing service_id:', serviceId);
        try {
          await removeProviderService(serviceId);
          console.log('[Onboarding] Successfully removed service_id:', serviceId);
        } catch (removeError: any) {
          console.error('[Onboarding] Failed to remove service_id:', serviceId, removeError?.response?.data || removeError);
          // Continuer meme si un retrait echoue
        }
      }

      // Ajouter les nouveaux services
      if (newServices.length > 0) {
        console.log('[Onboarding] Adding new services:', newServices);
        await addProviderServices(newServices);
      }

      // Mettre à jour initialServices pour refléter l'état actuel
      // Cela évite les problèmes si l'utilisateur revient sur cette page sans rechargement complet
      if (newServices.length > 0 || removedServices.length > 0) {
        console.log('[Onboarding] Updating initialServices to match selectedServices:', selectedServices);
        setInitialServices([...selectedServices]);
      }

      // Notifier les autres écrans si changements
      if (newServices.length > 0 || removedServices.length > 0) {
        console.log('[Onboarding] Emitting REFRESH_PROVIDER_SERVICES event');
        appEvents.emit(EVENTS.REFRESH_PROVIDER_SERVICES);
        // Petit delai pour laisser les ecrans traiter l'evenement
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        console.log('[Onboarding] No changes, not emitting event');
      }

      // Upload des diplômes pour chaque catégorie
      for (const category of Object.keys(diplomaFiles)) {
        const fileUri = diplomaFiles[category];
        if (fileUri) {
          console.log(`[Onboarding] Uploading diploma for category: ${category}`);
          try {
            const result = await uploadProviderDiploma(fileUri, category);
            console.log(`[Onboarding] Diploma uploaded successfully for ${category}:`, result.diploma_path);
          } catch (docError: any) {
            console.error(`[Onboarding] Diploma upload failed for ${category}:`, docError?.response?.data || docError);
            // On continue même si l'upload échoue
          }
        }
      }

      hapticFeedback.success();

      // Si le prestataire a déjà des formules, retourner au dashboard
      // Sinon, aller à la sélection des formules (nouveau prestataire)
      if (hasExistingFormulas) {
        console.log('[Onboarding] Has formulas, going to dashboard');
        router.replace("/(provider)" as any);
      } else {
        console.log('[Onboarding] No formulas, going to select-plan');
        router.replace("/auth/select-plan" as any);
      }
    } catch (error: any) {
      console.error("Erreur mise à jour services:", error);
      hapticFeedback.error();
      Alert.alert(
        t('common.error'),
        error?.message || t('providerOnboarding.saveError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedCountForCategory = (categoryId: number) => {
    const categoryServices = getServicesByCategory(categoryId);
    return categoryServices.filter(s => selectedServices.includes(Number(s.id))).length;
  };

  // Sélectionner un fichier diplôme pour une catégorie
  const handlePickDiploma = async (category: string) => {
    hapticFeedback.light();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setDiplomaFiles(prev => ({ ...prev, [category]: asset.uri }));
      // Extraire le nom du fichier
      const fileName = asset.uri.split("/").pop() || "diplome.jpg";
      setDiplomaFileNames(prev => ({ ...prev, [category]: fileName }));
      console.log(`[Onboarding] Diploma selected for ${category}:`, fileName);
    }
  };

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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.primary, '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>{t('providerOnboarding.loadingServices')}</Text>
        </LinearGradient>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.primary, '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.errorGradient}
        >
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
          </View>
          <Text style={styles.errorTitle}>{t('providerOnboarding.oops')}</Text>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity
            style={styles.reconnectButton}
            onPress={() => router.replace('/auth/login' as any)}
          >
            <Text style={styles.reconnectButtonText}>{t('providerOnboarding.reconnect')}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header compact avec gradient */}
      <LinearGradient
        colors={[colors.primary, '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          {/* Indicateur d'étape + Titre sur une ligne */}
          <View style={styles.headerTop}>
            <View style={styles.stepIndicator}>
              <View style={styles.stepDot}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, styles.stepDotInactive]}>
                <Text style={[styles.stepNumber, styles.stepNumberInactive]}>2</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.title, isRTL && styles.rtlText]}>✨ {t('providerOnboarding.selectServices')}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
            {t('providerOnboarding.chooseServices')}
          </Text>

          {/* Stats compacts */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{services.length}</Text>
              <Text style={styles.statLabel}>{t('providerOnboarding.available')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{selectedServices.length}</Text>
              <Text style={styles.statLabel}>{t('providerOnboarding.selected')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{categories.length}</Text>
              <Text style={styles.statLabel}>{t('providerOnboarding.categories')}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Catégories et Services */}
      <ScrollView
        ref={scrollViewRef}
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
          const categoryEmoji = getEmoji(category.icon, category.slug);
          const gradient = getCategoryGradient(category.slug);

          return (
            <View key={category.id} style={styles.categorySection}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(catId)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryGradient}
                >
                  <View style={styles.categoryLeft}>
                    <View style={styles.categoryIconContainer}>
                      <Text style={styles.categoryIcon}>{categoryEmoji}</Text>
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{getCategoryTranslation(category.name, language)}</Text>
                      <Text style={styles.categoryCount}>
                        {categoryServices.length} {t('providerOnboarding.servicesAvailable')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    {selectedCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{selectedCount}</Text>
                      </View>
                    )}
                    <View style={styles.expandIconContainer}>
                      <Text style={styles.expandIcon}>
                        {isExpanded ? "▼" : "▶"}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.servicesList}>
                  {categoryServices.length > 0 && (
                    <TouchableOpacity
                      style={[styles.selectAllButton, { backgroundColor: gradient[0] + '15' }]}
                      onPress={() => selectAllInCategory(catId)}
                    >
                      <Text style={[styles.selectAllText, { color: gradient[0] }]}>
                        {allSelected ? t('providerOnboarding.deselectAll') : t('providerOnboarding.selectAll')}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {categoryServices.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyIcon}>📭</Text>
                      <Text style={styles.emptyText}>{t('providerOnboarding.noServicesCategory')}</Text>
                    </View>
                  ) : (
                    categoryServices.map((service) => {
                      const serviceId = Number(service.id);
                      const isSelected = selectedServices.includes(serviceId);
                      const rawServiceName = service.title || service.name || "";
                      const translatedService = getServiceTranslation(rawServiceName, language);
                      const serviceName = translatedService.title || rawServiceName;
                      const serviceDesc = translatedService.description || service.description;
                      const needsDiploma = serviceRequiresDiploma(rawServiceName);

                      return (
                        <TouchableOpacity
                          key={service.id}
                          style={[
                            styles.serviceItem,
                            isSelected && [styles.serviceItemSelected, { borderColor: gradient[0] }],
                          ]}
                          onPress={() => toggleService(serviceId)}
                          activeOpacity={0.8}
                        >
                          {/* Indicateur de sélection à gauche */}
                          <View style={[
                            styles.selectionIndicator,
                            { backgroundColor: isSelected ? gradient[0] : colors.gray[200] }
                          ]} />

                          <Image
                            source={{ uri: service.images?.[0] || service.thumbnail }}
                            style={styles.serviceImage}
                          />
                          <View style={styles.serviceInfo}>
                            <View style={styles.serviceTitleRow}>
                              <Text style={styles.serviceTitle} numberOfLines={1}>
                                {serviceName}
                              </Text>
                              {needsDiploma && (
                                <View style={styles.diplomaBadge}>
                                  <Text style={styles.diplomaBadgeText}>🎓</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.serviceDescription} numberOfLines={2}>
                              {serviceDesc}
                            </Text>
                            <View style={styles.serviceMeta}>
                              <View style={[styles.priceTag, { backgroundColor: gradient[0] + '15' }]}>
                                <Text style={[styles.servicePrice, { color: gradient[0] }]}>
                                  {service.price} MAD
                                </Text>
                              </View>
                              {service.duration_minutes && (
                                <View style={styles.durationTag}>
                                  <Text style={styles.serviceDuration}>
                                    ⏱️ {service.duration_minutes} min
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={[
                            styles.checkbox,
                            isSelected && [styles.checkboxSelected, { backgroundColor: gradient[0], borderColor: gradient[0] }],
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

        {/* Sections Diplômes - affichées pour chaque catégorie nécessitant un diplôme */}
        {requiredDiplomaCategories.length > 0 && (
          <View style={styles.diplomasContainer}>
            <View style={styles.diplomasHeader}>
              <Text style={styles.diplomasHeaderIcon}>🎓</Text>
              <Text style={[styles.diplomasHeaderTitle, isRTL && styles.rtlText]}>{t('providerOnboarding.diplomasRequired')}</Text>
            </View>

            {requiredDiplomaCategories.map((category) => {
              const categoryInfo = getDiplomaCategoryInfo(category);
              const hasNewFile = !!diplomaFiles[category];
              const hasExisting = !!existingDiplomas[category];
              const hasFile = hasNewFile || hasExisting;
              const fileName = hasNewFile
                ? diplomaFileNames[category]
                : (hasExisting ? existingDiplomas[category].file_name : "");
              const isVerified = hasExisting && existingDiplomas[category].is_verified;

              return (
                <View key={category} style={styles.diplomaSection}>
                  <LinearGradient
                    colors={category === 'beaute' ? ['#EC4899', '#F472B6'] :
                            category === 'bien-etre' ? ['#10B981', '#34D399'] :
                            ['#F59E0B', '#FBBF24']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.diplomaSectionHeader}
                  >
                    <Text style={styles.diplomaSectionIcon}>{categoryInfo?.icon || '📜'}</Text>
                    <View style={styles.diplomaSectionInfo}>
                      <Text style={[styles.diplomaSectionTitle, isRTL && styles.rtlText]}>
                        {categoryInfo?.label?.[language] || categoryInfo?.label?.fr || category}
                      </Text>
                      <Text style={[styles.diplomaSectionSubtitle, isRTL && styles.rtlText]}>
                        {categoryInfo?.description?.[language] || categoryInfo?.description?.fr || t('providerOnboarding.certificateRequired')}
                      </Text>
                    </View>
                    {isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedBadgeText}>✓ {t('providerOnboarding.verified')}</Text>
                      </View>
                    )}
                  </LinearGradient>

                  <TouchableOpacity
                    style={[
                      styles.diplomaUploadButton,
                      hasFile && styles.diplomaUploadButtonSuccess,
                    ]}
                    onPress={() => handlePickDiploma(category)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.diplomaUploadContent}>
                      <Text style={styles.diplomaUploadIcon}>
                        {hasFile ? "✅" : "📄"}
                      </Text>
                      <View style={styles.diplomaUploadText}>
                        <Text style={styles.diplomaUploadTitle}>
                          {hasFile ? t('providerOnboarding.diplomaAdded') : t('providerOnboarding.addDiploma')}
                        </Text>
                        <Text style={styles.diplomaUploadHint}>
                          {hasFile ? fileName : t('providerOnboarding.diplomaHint')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.diplomaUploadArrow}>
                      {hasFile ? "✓" : "→"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Note d'information */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoCardGradient}
          >
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={[styles.infoText, isRTL && styles.rtlText]}>
              {t('providerOnboarding.canModifyLater')}
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isSubmitting || selectedServices.length === 0) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || selectedServices.length === 0}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={selectedServices.length > 0 ? [colors.primary, '#8B5CF6'] : [colors.gray[300], colors.gray[400]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {selectedServices.length > 0
                    ? t('providerOnboarding.nextWithCount', { count: selectedServices.length })
                    : t('providerOnboarding.selectAtLeastOneShort')}
                </Text>
                {selectedServices.length > 0 && (
                  <Text style={styles.submitButtonArrow}>{isRTL ? '←' : '→'}</Text>
                )}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },

  // Loading
  loadingGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.white,
    fontWeight: '500',
  },

  // Error
  errorGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.9)',
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  reconnectButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  reconnectButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary,
  },

  // Header compact
  header: {
    paddingBottom: spacing.md,
  },
  headerTop: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepNumber: {
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
    color: colors.primary,
  },
  stepNumberInactive: {
    color: 'rgba(255,255,255,0.7)',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "bold",
    color: colors.white,
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Stats compacts
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.white,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  // Category
  categorySection: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  categoryGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  categoryName: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    color: colors.white,
  },
  categoryCount: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    minWidth: 28,
    alignItems: "center",
  },
  badgeText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: "bold",
  },
  expandIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    fontSize: 10,
    color: colors.white,
  },

  // Services list
  servicesList: {
    paddingTop: spacing.md,
  },
  selectAllButton: {
    alignSelf: "flex-end",
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  selectAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: "center",
    fontStyle: "italic",
  },

  // Service item
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gray[200],
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  serviceItemSelected: {
    backgroundColor: colors.white,
  },
  selectionIndicator: {
    width: 4,
    alignSelf: 'stretch',
  },
  serviceImage: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[200],
    marginLeft: spacing.sm,
    marginVertical: spacing.sm,
  },
  serviceInfo: {
    flex: 1,
    marginLeft: spacing.md,
    paddingVertical: spacing.sm,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  serviceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.gray[900],
    flex: 1,
  },
  diplomaBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: spacing.xs,
  },
  diplomaBadgeText: {
    fontSize: 12,
  },
  serviceDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  priceTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.md,
  },
  servicePrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: "bold",
  },
  durationTag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.md,
  },
  serviceDuration: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.md,
  },
  checkboxSelected: {},
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },

  // Info card
  infoCard: {
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  infoCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 18,
  },

  // Diplomas Container
  diplomasContainer: {
    marginBottom: spacing.lg,
  },
  diplomasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  diplomasHeaderIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  diplomasHeaderTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[800],
  },

  // Diploma Section
  diplomaSection: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  diplomaSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  diplomaSectionIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  diplomaSectionInfo: {
    flex: 1,
  },
  diplomaSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  diplomaSectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginLeft: 'auto',
  },
  verifiedBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },
  diplomaUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  diplomaUploadButtonSuccess: {
    backgroundColor: '#D1FAE5',
    borderTopColor: '#6EE7B7',
  },
  diplomaUploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  diplomaUploadIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  diplomaUploadText: {
    flex: 1,
  },
  diplomaUploadTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 2,
  },
  diplomaUploadHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  diplomaUploadArrow: {
    fontSize: 20,
    color: colors.gray[600],
    marginLeft: spacing.md,
  },

  // Footer compact
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    ...shadows.md,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "700",
    color: colors.white,
  },
  submitButtonArrow: {
    fontSize: typography.fontSize.lg,
    color: colors.white,
    fontWeight: 'bold',
  },
  // RTL support
  rtlText: {
    textAlign: 'right',
  },
});
