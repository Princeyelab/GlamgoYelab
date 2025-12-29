/**
 * Edit Profile - GlamGo Mobile
 * Modification du profil utilisateur
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
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../src/lib/store/hooks';
import { selectAuth, updateUserProfile } from '../src/lib/store/slices/authSlice';
import { hapticFeedback } from '../src/lib/utils/haptics';

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector(selectAuth);

  // Form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const changed =
      firstName !== (user?.first_name || '') ||
      lastName !== (user?.last_name || '') ||
      phone !== (user?.phone || '');
    setHasChanges(changed);
  }, [firstName, lastName, phone, user]);

  const handleSave = async () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    try {
      hapticFeedback.medium();

      await dispatch(updateUserProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        // address n'existe pas encore dans la DB
      })).unwrap();

      hapticFeedback.success();
      Alert.alert('Succes', 'Profil mis a jour', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      hapticFeedback.error();
      Alert.alert('Erreur', error?.message || 'Impossible de mettre a jour le profil');
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Modifications non sauvegardees',
        'Voulez-vous vraiment quitter sans sauvegarder ?',
        [
          { text: 'Continuer', style: 'cancel' },
          { text: 'Quitter', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Non connecte</Text>
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
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(firstName || user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Prenom"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Votre prenom"
              autoCapitalize="words"
            />

            <Input
              label="Nom"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Votre nom"
              autoCapitalize="words"
            />

            <Input
              label="Email"
              value={user.email}
              editable={false}
              style={styles.disabledInput}
            />

            <Input
              label="Telephone"
              value={phone}
              onChangeText={setPhone}
              placeholder="06 XX XX XX XX"
              keyboardType="phone-pad"
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              fullWidth
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading || !hasChanges}
            >
              Sauvegarder
            </Button>

            <Button
              variant="ghost"
              fullWidth
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              Annuler
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
});
