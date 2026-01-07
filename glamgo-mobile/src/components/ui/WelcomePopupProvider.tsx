/**
 * WelcomePopupProvider Component - GlamGo Mobile
 * Popup de bienvenue apres inscription prestataire reussie
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
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';
import { useLanguage } from '../../contexts/LanguageContext';

interface WelcomePopupProviderProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  onGoToDashboard?: () => void;
  onGoToOnboarding?: () => void;
}

const { width } = Dimensions.get('window');

export default function WelcomePopupProvider({
  visible,
  onClose,
  userName,
  onGoToDashboard,
  onGoToOnboarding,
}: WelcomePopupProviderProps) {
  const { t, isRTL } = useLanguage();

  const handleSelectServices = () => {
    if (onGoToOnboarding) {
      onGoToOnboarding();
    } else {
      onClose();
    }
  };

  const handleGoToDashboard = () => {
    if (onGoToDashboard) {
      onGoToDashboard();
    } else {
      onClose();
    }
  };

  const getTitle = () => {
    if (userName) {
      return t('welcomePopupProvider.titleWithName').replace('{name}', userName);
    }
    return t('welcomePopupProvider.title');
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
              {t('welcomePopupProvider.message')}
            </Text>

            {/* Info Box */}
            <View style={[styles.infoBox, isRTL && styles.infoBoxRTL]}>
              <Text style={[styles.infoIcon, isRTL && styles.infoIconRTL]}>💡</Text>
              <Text style={[styles.infoText, isRTL && styles.textRTL]}>
                {t('welcomePopupProvider.infoTip')}
              </Text>
            </View>

            {/* Highlight Box */}
            <View style={[styles.highlightBox, isRTL && styles.highlightBoxRTL]}>
              <Text style={[styles.highlightIcon, isRTL && styles.highlightIconRTL]}>💎</Text>
              <Text style={[styles.highlightText, isRTL && styles.textRTL]}>
                {t('welcomePopupProvider.highlight')}
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSelectServices}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryBtnText, isRTL && styles.textRTL]}>{t('welcomePopupProvider.selectServices')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleGoToDashboard}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryBtnText, isRTL && styles.textRTL]}>{t('welcomePopupProvider.later')}</Text>
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
    marginBottom: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[50],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  infoIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    lineHeight: 18,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  highlightIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  highlightText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  buttons: {
    width: '100%',
    gap: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
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
  infoBoxRTL: {
    flexDirection: 'row-reverse',
  },
  infoIconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  highlightBoxRTL: {
    flexDirection: 'row-reverse',
  },
  highlightIconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
});
