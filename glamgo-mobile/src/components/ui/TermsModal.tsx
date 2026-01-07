import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';
import { useLanguage } from '../../contexts/LanguageContext';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: 'client' | 'provider';
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TermsModal({ isOpen, onClose, userType = 'client' }: TermsModalProps) {
  const { t, isRTL, language } = useLanguage();
  const currentDate = new Date().toLocaleDateString(language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR');

  // Get translated terms content
  const termsContent = userType === 'client'
    ? `${t('terms.lastUpdated')} : ${currentDate}\n\n${t('terms.clientTerms')}`
    : `${t('terms.lastUpdated')} : ${currentDate}\n\n${t('terms.providerTerms')}`;

  const title = userType === 'client'
    ? t('terms.clientTitle')
    : t('terms.providerTitle');

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={[styles.header, isRTL && styles.headerRTL]}>
              <Text style={[styles.title, isRTL && styles.titleRTL]}>{title}</Text>
              <TouchableOpacity
                style={[styles.closeButton, isRTL && styles.closeButtonRTL]}
                onPress={onClose}
                accessibilityLabel={t('terms.close')}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView
              style={styles.body}
              showsVerticalScrollIndicator={true}
            >
              <Text style={[styles.termsText, isRTL && styles.termsTextRTL]}>{termsContent}</Text>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={onClose}
              >
                <Text style={[styles.acceptButtonText, isRTL && styles.acceptButtonTextRTL]}>{t('terms.accept')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.gray[600],
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  termsText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 24,
    color: colors.gray[700],
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.gray[200],
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },

  // RTL Styles
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  titleRTL: {
    textAlign: 'right',
  },
  closeButtonRTL: {
    marginLeft: 0,
    marginRight: spacing.sm,
  },
  termsTextRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  acceptButtonTextRTL: {
    textAlign: 'center',
  },
});
