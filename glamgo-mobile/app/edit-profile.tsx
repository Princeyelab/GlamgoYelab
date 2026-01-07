/**
 * Edit Profile - GlamGo Mobile
 * Modification du profil utilisateur avec upload photo
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../src/lib/store/hooks';
import { selectAuth, updateUserProfile, setUser } from '../src/lib/store/slices/authSlice';
import { hapticFeedback } from '../src/lib/utils/haptics';
import { uploadProviderImage, getProviderProfile } from '../src/lib/api/providerAPI';
import { API_BASE_URL } from '../src/lib/api/client';
import { useLanguage } from '../src/contexts/LanguageContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector(selectAuth);
  const { t, isRTL } = useLanguage();

  // Form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [hasChanges, setHasChanges] = useState(false);

  // Photo state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(user?.avatar || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Charger la photo actuelle depuis l'API provider
  useEffect(() => {
    const loadCurrentPhoto = async () => {
      if (user?.user_type === 'provider') {
        try {
          const profile = await getProviderProfile();
          if (profile.avatar) {
            const fullUrl = profile.avatar.startsWith('http')
              ? profile.avatar
              : `${API_BASE_URL}${profile.avatar}`;
            setCurrentAvatar(fullUrl);
          }
        } catch (error) {
          console.log('[EditProfile] Could not load provider photo');
        }
      }
    };
    loadCurrentPhoto();
  }, [user]);

  // Track changes
  useEffect(() => {
    const changed =
      firstName !== (user?.first_name || '') ||
      lastName !== (user?.last_name || '') ||
      phone !== (user?.phone || '') ||
      profilePhoto !== null;
    setHasChanges(changed);
  }, [firstName, lastName, phone, user, profilePhoto]);

  // Choisir une photo
  const pickImage = async () => {
    hapticFeedback.light();

    Alert.alert(
      t('editProfile.changePhotoTitle'),
      t('editProfile.changePhotoMessage'),
      [
        {
          text: t('editProfile.camera'),
          onPress: async () => {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraPermission.granted) {
              Alert.alert(t('editProfile.permissionRequired'), t('editProfile.cameraPermissionMessage'));
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setProfilePhoto(result.assets[0].uri);
            }
          },
        },
        {
          text: t('editProfile.gallery'),
          onPress: async () => {
            const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!galleryPermission.granted) {
              Alert.alert(t('editProfile.permissionRequired'), t('editProfile.galleryPermissionMessage'));
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              setProfilePhoto(result.assets[0].uri);
            }
          },
        },
        { text: t('editProfile.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    try {
      hapticFeedback.medium();
      let photoUpdated = false;

      // Upload de la photo si modifiée
      // Detecter si on est prestataire: user_type === 'provider' OU undefined (contexte provider)
      const isProvider = user?.user_type === 'provider' || user?.user_type === 'prestataire' || !user?.user_type;

      if (profilePhoto && isProvider) {
        setIsUploadingPhoto(true);
        try {
          console.log('[EditProfile] Uploading photo...');
          const result = await uploadProviderImage(profilePhoto);
          console.log('[EditProfile] Photo uploaded:', result.image_url);

          // Mettre à jour l'avatar dans le state local
          const fullUrl = result.image_url.startsWith('http')
            ? result.image_url
            : `${API_BASE_URL}${result.image_url}`;
          setCurrentAvatar(fullUrl);
          setProfilePhoto(null);
          photoUpdated = true;

          // Mettre à jour le user dans Redux avec le nouvel avatar
          dispatch(setUser({
            ...user,
            avatar: fullUrl,
          }));
        } catch (uploadError: any) {
          console.error('[EditProfile] Photo upload error:', uploadError);
          Alert.alert(t('editProfile.error'), t('editProfile.cannotUpdatePhoto'));
          setIsUploadingPhoto(false);
          return;
        }
        setIsUploadingPhoto(false);
      }

      // Mettre à jour les autres champs du profil
      const profileChanged =
        firstName !== (user?.first_name || '') ||
        lastName !== (user?.last_name || '') ||
        phone !== (user?.phone || '');

      if (profileChanged) {
        await dispatch(updateUserProfile({
          first_name: firstName,
          last_name: lastName,
          phone,
        })).unwrap();
      }

      hapticFeedback.success();
      const message = photoUpdated && profileChanged
        ? t('editProfile.photoAndProfileUpdated')
        : photoUpdated
        ? t('editProfile.photoUpdated')
        : t('editProfile.profileUpdated');

      Alert.alert(t('editProfile.success'), message, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      hapticFeedback.error();
      Alert.alert(t('editProfile.error'), error?.message || t('editProfile.cannotUpdateProfile'));
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        t('editProfile.unsavedChangesTitle'),
        t('editProfile.unsavedChangesMessage'),
        [
          { text: t('editProfile.continueEditing'), style: 'cancel' },
          { text: t('editProfile.quit'), style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>{t('editProfile.notConnected')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, isRTL && styles.rowRTL]}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Avatar avec bouton de modification */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickImage}
            disabled={isUploadingPhoto}
          >
            {isUploadingPhoto ? (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ActivityIndicator size="large" color={colors.white} />
              </View>
            ) : profilePhoto || currentAvatar ? (
              <Image
                source={{ uri: profilePhoto || currentAvatar || undefined }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {(firstName || user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {/* Badge de modification */}
            <View style={[styles.avatarEditBadge, isRTL && styles.avatarEditBadgeRTL]}>
              <Text style={styles.avatarEditIcon}>{'📷'}</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, isRTL && styles.textRTL]}>{t('editProfile.tapToChangePhoto')}</Text>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label={t('editProfile.firstName')}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('editProfile.firstNamePlaceholder')}
              autoCapitalize="words"
              style={isRTL ? styles.inputRTL : undefined}
            />

            <Input
              label={t('editProfile.lastName')}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('editProfile.lastNamePlaceholder')}
              autoCapitalize="words"
              style={isRTL ? styles.inputRTL : undefined}
            />

            <Input
              label={t('editProfile.email')}
              value={user.email}
              editable={false}
              style={[styles.disabledInput, isRTL && styles.inputRTL]}
            />

            <Input
              label={t('editProfile.phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('editProfile.phonePlaceholder')}
              keyboardType="phone-pad"
              style={isRTL ? styles.inputRTL : undefined}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              fullWidth
              onPress={handleSave}
              loading={isLoading || isUploadingPhoto}
              disabled={isLoading || isUploadingPhoto || !hasChanges}
            >
              {isUploadingPhoto ? t('editProfile.uploading') : t('editProfile.saveChanges')}
            </Button>

            <Button
              variant="ghost"
              fullWidth
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              {t('editProfile.cancel')}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
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
  content: {
    padding: spacing.xl,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  avatarEditIcon: {
    fontSize: 18,
  },
  avatarHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  disabledInput: {
    backgroundColor: colors.gray[100],
    color: colors.gray[500],
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.xs,
  },
  // RTL Styles
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  avatarEditBadgeRTL: {
    right: 'auto',
    left: 0,
  },
});
