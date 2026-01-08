/**
 * LanguageSelector - Composant de selection de langue
 * Permet de basculer entre francais, anglais et arabe
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
  Modal,
  Pressable,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { useLanguage, type Language } from '../../contexts/LanguageContext';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'fr', name: 'Francais', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇲🇦' },
];

/**
 * Version compacte du sélecteur de langue pour le header
 */
export function LanguageSelectorCompact() {
  const { language, setLanguage } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const handleLanguageChange = (lang: Language) => {
    if (lang !== language) {
      setLanguage(lang);
    }
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={compactStyles.button}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={compactStyles.flag}>{currentLang.flag}</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={compactStyles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={compactStyles.modalContent}>
            <Text style={compactStyles.modalTitle}>🌐</Text>
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    compactStyles.langOption,
                    isSelected && compactStyles.langOptionSelected,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={compactStyles.langFlag}>{lang.flag}</Text>
                  <Text style={[
                    compactStyles.langName,
                    isSelected && compactStyles.langNameSelected,
                  ]}>
                    {lang.nativeName}
                  </Text>
                  {isSelected && (
                    <Text style={compactStyles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const compactStyles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    ...shadows.sm,
  },
  flag: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '80%',
    maxWidth: 300,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  langOptionSelected: {
    backgroundColor: colors.primary + '15',
  },
  langFlag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  langName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.gray[800],
  },
  langNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export function LanguageSelector() {
  const { language, setLanguage, t, isRTL } = useLanguage();

  const handleLanguageChange = (lang: Language) => {
    if (lang !== language) {
      setLanguage(lang);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isRTL && styles.textRTL]}>
        {t('languages.title')}
      </Text>
      <View style={styles.optionsContainer}>
        {languages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
              onPress={() => handleLanguageChange(lang.code)}
              activeOpacity={0.7}
            >
              <View style={styles.flagContainer}>
                <Text style={styles.flag}>{lang.flag}</Text>
              </View>
              <View style={styles.labelContainer}>
                <Text style={[
                  styles.languageName,
                  isSelected && styles.languageNameSelected,
                ]}>
                  {lang.nativeName}
                </Text>
                <Text style={[
                  styles.languageSubtitle,
                  isSelected && styles.languageSubtitleSelected,
                ]}>
                  {lang.name}
                </Text>
              </View>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {I18nManager.isRTL !== (language === 'ar') && (
        <Text style={styles.restartNote}>
          {t('languages.restartMessage')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  textRTL: {
    textAlign: 'right',
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    marginHorizontal: spacing.md,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(230, 57, 70, 0.05)',
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  flag: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[700],
  },
  labelContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[800],
  },
  languageNameSelected: {
    color: colors.primary,
  },
  languageSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  languageSubtitleSelected: {
    color: colors.primary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  restartNote: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
});

export default LanguageSelector;
