/**
 * Gestion des services personnalisés du prestataire
 * Permet de créer, modifier et supprimer des services personnalisés
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors, spacing, typography, borderRadius, shadows } from "../../src/lib/constants/theme";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { getCategoryTranslation } from "../../src/i18n/translations/services";
import { getCategories } from "../../src/lib/api/servicesAPI";
import {
  getCustomServices,
  createCustomService,
  updateCustomService,
  deleteCustomService,
  uploadCustomServiceImages,
  deleteCustomServiceImage,
  CustomService,
  CustomServiceInput,
} from "../../src/lib/api/providerAPI";
import { API_BASE_URL } from "../../src/lib/api/client";
import { hapticFeedback } from "../../src/lib/utils/haptics";
import { Category } from "../../src/types/service";

export default function CustomServicesScreen() {
  const router = useRouter();
  const { t, language, isRTL } = useLanguage();
  const [services, setServices] = useState<CustomService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maxAllowed, setMaxAllowed] = useState(10);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<CustomService | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("60");
  const [formCategoryId, setFormCategoryId] = useState<number | null>(null);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [servicesData, categoriesData] = await Promise.all([
        getCustomServices(),
        getCategories(),
      ]);
      setServices(servicesData.services);
      setMaxAllowed(servicesData.max_allowed);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Erreur chargement:", error);
      Alert.alert(t('common.error'), t('customServices.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open add modal
  const handleAdd = () => {
    if (services.length >= maxAllowed) {
      Alert.alert(
        t('customServices.limitReached'),
        t('customServices.maxServicesMessage', { max: maxAllowed })
      );
      return;
    }
    setEditingService(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormDuration("60");
    setFormCategoryId(categories.length > 0 ? Number(categories[0].id) : null);
    setFormImages([]);
    setNewImages([]);
    setModalVisible(true);
    hapticFeedback.light();
  };

  // Open edit modal
  const handleEdit = (service: CustomService) => {
    setEditingService(service);
    setFormName(service.name);
    setFormDescription(service.description || "");
    setFormPrice(String(service.price));
    setFormDuration(String(service.duration_minutes));
    setFormCategoryId(service.category_id);
    setFormImages(service.images || []);
    setNewImages([]);
    setModalVisible(true);
    hapticFeedback.light();
  };

  // Delete service
  const handleDelete = (service: CustomService) => {
    Alert.alert(
      t('customServices.deleteService'),
      t('customServices.confirmDeleteService', { name: service.name }),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomService(service.id);
              hapticFeedback.success();
              setServices((prev) => prev.filter((s) => s.id !== service.id));
            } catch (error) {
              console.error("Erreur suppression:", error);
              Alert.alert(t('common.error'), t('customServices.deleteError'));
            }
          },
        },
      ]
    );
  };

  // Toggle service active status
  const handleToggleActive = async (service: CustomService) => {
    try {
      const updated = await updateCustomService(service.id, {
        is_active: !service.is_active,
      });
      hapticFeedback.selection();
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, is_active: updated.is_active } : s))
      );
    } catch (error) {
      console.error("Erreur mise à jour:", error);
    }
  };

  // Pick images
  const handlePickImages = async () => {
    const currentTotal = formImages.length + newImages.length;
    if (currentTotal >= 5) {
      Alert.alert(t('customServices.limitReached'), t('customServices.maxImagesMessage'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - currentTotal,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map((a) => a.uri);
      setNewImages((prev) => [...prev, ...uris].slice(0, 5 - formImages.length));
      hapticFeedback.selection();
    }
  };

  // Remove image
  const handleRemoveImage = async (index: number, isExisting: boolean) => {
    if (isExisting) {
      // Remove from server if editing
      if (editingService) {
        try {
          const result = await deleteCustomServiceImage(editingService.id, index);
          setFormImages(result.images);
          hapticFeedback.selection();
        } catch (error) {
          console.error("Erreur suppression image:", error);
        }
      }
    } else {
      // Remove from new images
      setNewImages((prev) => prev.filter((_, i) => i !== index));
      hapticFeedback.selection();
    }
  };

  // Save service
  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert(t('common.error'), t('customServices.nameRequired'));
      return;
    }
    if (!formCategoryId) {
      Alert.alert(t('common.error'), t('customServices.categoryRequired'));
      return;
    }
    if (!formPrice || parseFloat(formPrice) <= 0) {
      Alert.alert(t('common.error'), t('customServices.priceRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const data: CustomServiceInput = {
        name: formName.trim(),
        description: formDescription.trim(),
        category_id: formCategoryId,
        price: parseFloat(formPrice),
        duration_minutes: parseInt(formDuration) || 60,
      };

      let savedService: CustomService;

      if (editingService) {
        // Update
        savedService = await updateCustomService(editingService.id, data);
      } else {
        // Create
        savedService = await createCustomService(data);
      }

      // Upload new images
      if (newImages.length > 0) {
        console.log("[CustomServices] Uploading", newImages.length, "images for service", savedService.id);
        try {
          const imagesResult = await uploadCustomServiceImages(savedService.id, newImages);
          console.log("[CustomServices] Images uploaded:", imagesResult);
          savedService.images = imagesResult.images;
        } catch (imgError: any) {
          console.error("[CustomServices] Erreur upload images:", imgError);
          console.error("[CustomServices] Response:", imgError?.response?.data);
          Alert.alert(t('customServices.warning'), t('customServices.imageUploadError'));
        }
      }

      hapticFeedback.success();

      // Update list
      if (editingService) {
        setServices((prev) =>
          prev.map((s) => (s.id === savedService.id ? savedService : s))
        );
      } else {
        setServices((prev) => [savedService, ...prev]);
      }

      setModalVisible(false);
    } catch (error: any) {
      console.error("Erreur sauvegarde:", error);
      console.error("Response data:", JSON.stringify(error?.response?.data));

      let errorMessage = t('customServices.saveError');
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (typeof errors === 'object') {
          errorMessage += "\n" + Object.values(errors).flat().join("\n");
        }
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Get image URL
  const getImageUrl = (path: string) => {
    if (path.startsWith("http") || path.startsWith("file://")) return path;
    return `${API_BASE_URL}${path}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[colors.primary, "#8B5CF6"]} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, "#8B5CF6"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>{t('customServices.myServices')}</Text>
              <Text style={[styles.headerSubtitle, isRTL && styles.rtlText]}>
                {services.length}/{maxAllowed} {t('common.services')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
              disabled={services.length >= maxAllowed}
            >
              <Ionicons name="add" size={28} color={colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={[styles.emptyTitle, isRTL && styles.rtlText]}>{t('customServices.noCustomServices')}</Text>
            <Text style={[styles.emptyText, isRTL && styles.rtlText]}>
              {t('customServices.emptyDescription')}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
              <LinearGradient
                colors={[colors.primary, "#8B5CF6"]}
                style={styles.emptyButtonGradient}
              >
                <Ionicons name="add" size={20} color={colors.white} />
                <Text style={styles.emptyButtonText}>{t('customServices.createService')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                {service.images && service.images.length > 0 ? (
                  <Image
                    source={{ uri: getImageUrl(service.images[0]) }}
                    style={styles.serviceImage}
                  />
                ) : (
                  <View style={[styles.serviceImage, styles.servicePlaceholder]}>
                    <Ionicons name="image-outline" size={24} color={colors.gray[400]} />
                  </View>
                )}
                <View style={styles.serviceInfo}>
                  <View style={styles.serviceTitleRow}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {service.name}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        service.is_active ? styles.statusActive : styles.statusInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          service.is_active ? styles.statusTextActive : styles.statusTextInactive,
                        ]}
                      >
                        {service.is_active ? t('common.active') : t('common.inactive')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.serviceCategory}>{getCategoryTranslation(service.category_name || '', language)}</Text>
                  <View style={styles.serviceMeta}>
                    <Text style={styles.servicePrice}>{service.price} MAD</Text>
                    <Text style={styles.serviceDuration}>{service.duration_minutes} min</Text>
                  </View>
                </View>
              </View>

              {service.description && (
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description}
                </Text>
              )}

              <View style={styles.serviceActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleToggleActive(service)}
                >
                  <Ionicons
                    name={service.is_active ? "pause-circle-outline" : "play-circle-outline"}
                    size={20}
                    color={service.is_active ? colors.warning : colors.success}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      { color: service.is_active ? colors.warning : colors.success },
                    ]}
                  >
                    {service.is_active ? t('customServices.deactivate') : t('customServices.activate')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(service)}
                >
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>
                    {t('common.edit')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(service)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>
                    {t('common.delete')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, isRTL && styles.rtlText]}>
            {t('customServices.infoText')}
          </Text>
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>
                {editingService ? t('customServices.editService') : t('customServices.newService')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, isRTL && styles.rtlText]}>{t('customServices.serviceName')} *</Text>
                <TextInput
                  style={[styles.formInput, isRTL && styles.rtlInput]}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder={t('customServices.serviceNamePlaceholder')}
                  maxLength={100}
                />
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, isRTL && styles.rtlText]}>{t('customServices.category')} *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryChips}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          formCategoryId === Number(cat.id) && styles.categoryChipSelected,
                        ]}
                        onPress={() => setFormCategoryId(Number(cat.id))}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            formCategoryId === Number(cat.id) && styles.categoryChipTextSelected,
                          ]}
                        >
                          {getCategoryTranslation(cat.name, language)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Price & Duration */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={[styles.formLabel, isRTL && styles.rtlText]}>{t('customServices.price')} *</Text>
                  <TextInput
                    style={[styles.formInput, isRTL && styles.rtlInput]}
                    value={formPrice}
                    onChangeText={setFormPrice}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, isRTL && styles.rtlText]}>{t('customServices.duration')} *</Text>
                  <TextInput
                    style={[styles.formInput, isRTL && styles.rtlInput]}
                    value={formDuration}
                    onChangeText={setFormDuration}
                    placeholder="60"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, isRTL && styles.rtlText]}>{t('customServices.description')}</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea, isRTL && styles.rtlInput]}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder={t('customServices.descriptionPlaceholder')}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              {/* Images */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, isRTL && styles.rtlText]}>
                  {t('customServices.photos')} ({formImages.length + newImages.length}/5)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.imagesRow}>
                    {/* Existing images */}
                    {formImages.map((img, index) => (
                      <View key={`existing-${index}`} style={styles.imageContainer}>
                        <Image source={{ uri: getImageUrl(img) }} style={styles.imagePreview} />
                        <TouchableOpacity
                          style={styles.imageRemove}
                          onPress={() => handleRemoveImage(index, true)}
                        >
                          <Ionicons name="close-circle" size={22} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* New images */}
                    {newImages.map((img, index) => (
                      <View key={`new-${index}`} style={styles.imageContainer}>
                        <Image source={{ uri: img }} style={styles.imagePreview} />
                        <TouchableOpacity
                          style={styles.imageRemove}
                          onPress={() => handleRemoveImage(index, false)}
                        >
                          <Ionicons name="close-circle" size={22} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* Add button */}
                    {formImages.length + newImages.length < 5 && (
                      <TouchableOpacity style={styles.imageAddButton} onPress={handlePickImages}>
                        <Ionicons name="add" size={32} color={colors.gray[400]} />
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>

            {/* Modal footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingService ? t('common.save') : t('customServices.create')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  loadingGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: typography.fontSize.base,
  },

  // Header
  header: {
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "bold",
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: "rgba(255,255,255,0.8)",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    textAlign: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },

  // Service card
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  serviceHeader: {
    flexDirection: "row",
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[200],
  },
  servicePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  serviceInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  serviceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serviceName: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.gray[900],
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusActive: {
    backgroundColor: colors.success + "20",
  },
  statusInactive: {
    backgroundColor: colors.gray[200],
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
  },
  statusTextActive: {
    color: colors.success,
  },
  statusTextInactive: {
    color: colors.gray[500],
  },
  serviceCategory: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  serviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  servicePrice: {
    fontSize: typography.fontSize.base,
    fontWeight: "bold",
    color: colors.primary,
  },
  serviceDuration: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  serviceDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  serviceActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
  },

  // Info card
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "10",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "bold",
    color: colors.gray[900],
  },
  modalBody: {
    padding: spacing.md,
    maxHeight: 500,
  },
  modalFooter: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.gray[600],
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.white,
  },

  // Form
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    backgroundColor: colors.gray[50],
  },
  formTextarea: {
    height: 80,
    textAlignVertical: "top",
  },
  formRow: {
    flexDirection: "row",
  },
  categoryChips: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  categoryChipSelected: {
    backgroundColor: colors.primary + "20",
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  categoryChipTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },

  // Images
  imagesRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  imageContainer: {
    position: "relative",
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[200],
  },
  imageRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  imageAddButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  // RTL styles
  rtlText: {
    textAlign: 'right',
  },
  rtlInput: {
    textAlign: 'right',
  },
});
