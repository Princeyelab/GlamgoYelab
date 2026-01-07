/**
 * WelcomePopup Component - GlamGo Mobile
 * Popup de bienvenue apres inscription reussie
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';
import { useLanguage } from '../../contexts/LanguageContext';

interface WelcomePopupProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
}

const { width } = Dimensions.get('window');

export default function WelcomePopup({
  visible,
  onClose,
  userName,
}: WelcomePopupProps) {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  const handleExploreServices = () => {
    onClose();
    router.push('/(client)' as any);
  };

  const getTitle = () => {
    if (userName) {
      return t('welcomePopup.titleWithName').replace('{name}', userName);
    }
    return t('welcomePopup.title');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {/* Close Button */}
          <TouchableOpacity style={[styles.closeBtn, isRTL && styles.closeBtnRTL]} onPress={onClose}>
            <Text style={styles.closeBtnText}>×</Text>
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.emoji}>🎉</Text>

            <Text style={[styles.title, isRTL && styles.textRTL]}>
              {getTitle()}
            </Text>

            <Text style={[styles.message, isRTL && styles.textRTL]}>
              {t('welcomePopup.message')}
            </Text>

            {/* Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.okBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.okBtnText, isRTL && styles.textRTL]}>{t('welcomePopup.letsGo')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={handleExploreServices}
                activeOpacity={0.8}
              >
                <Text style={[styles.exploreBtnText, isRTL && styles.textRTL]}>{t('welcomePopup.exploreServices')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  popup: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    width: width - spacing.lg * 2,
    maxWidth: 400,
    padding: spacing.xl,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeBtnText: {
    fontSize: 24,
    color: colors.gray[500],
    lineHeight: 26,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  buttons: {
    width: '100%',
    gap: spacing.sm,
  },
  okBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  okBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  exploreBtn: {
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  exploreBtnText: {
    color: colors.gray[700],
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },

  // RTL Styles
  textRTL: {
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  closeBtnRTL: {
    right: undefined,
    left: spacing.sm,
  },
});
