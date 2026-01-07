import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';
import { useLanguage } from '../src/contexts/LanguageContext';

type TabType = 'client' | 'provider';

export default function HowItWorksScreen() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('client');

  const CLIENT_STEPS = [
    {
      number: '1',
      icon: '📱',
      title: t('howItWorksPage.clientStep1Title'),
      desc: t('howItWorksPage.clientStep1Desc'),
      details: [
        t('howItWorksPage.clientStep1Detail1'),
        t('howItWorksPage.clientStep1Detail2'),
        t('howItWorksPage.clientStep1Detail3'),
        t('howItWorksPage.clientStep1Detail4'),
      ],
    },
    {
      number: '2',
      icon: '🔍',
      title: t('howItWorksPage.clientStep2Title'),
      desc: t('howItWorksPage.clientStep2Desc'),
      details: [
        t('howItWorksPage.clientStep2Detail1'),
        t('howItWorksPage.clientStep2Detail2'),
        t('howItWorksPage.clientStep2Detail3'),
        t('howItWorksPage.clientStep2Detail4'),
      ],
    },
    {
      number: '3',
      icon: '📅',
      title: t('howItWorksPage.clientStep3Title'),
      desc: t('howItWorksPage.clientStep3Desc'),
      details: [
        t('howItWorksPage.clientStep3Detail1'),
        t('howItWorksPage.clientStep3Detail2'),
        t('howItWorksPage.clientStep3Detail3'),
        t('howItWorksPage.clientStep3Detail4'),
        t('howItWorksPage.clientStep3Detail5'),
      ],
    },
    {
      number: '4',
      icon: '💳',
      title: t('howItWorksPage.clientStep4Title'),
      desc: t('howItWorksPage.clientStep4Desc'),
      details: [
        t('howItWorksPage.clientStep4Detail1'),
        t('howItWorksPage.clientStep4Detail2'),
        t('howItWorksPage.clientStep4Detail3'),
        t('howItWorksPage.clientStep4Detail4'),
        t('howItWorksPage.clientStep4Detail5'),
      ],
    },
    {
      number: '5',
      icon: '📍',
      title: t('howItWorksPage.clientStep5Title'),
      desc: t('howItWorksPage.clientStep5Desc'),
      details: [
        t('howItWorksPage.clientStep5Detail1'),
        t('howItWorksPage.clientStep5Detail2'),
        t('howItWorksPage.clientStep5Detail3'),
        t('howItWorksPage.clientStep5Detail4'),
        t('howItWorksPage.clientStep5Detail5'),
      ],
    },
    {
      number: '6',
      icon: '⭐',
      title: t('howItWorksPage.clientStep6Title'),
      desc: t('howItWorksPage.clientStep6Desc'),
      details: [
        t('howItWorksPage.clientStep6Detail1'),
        t('howItWorksPage.clientStep6Detail2'),
        t('howItWorksPage.clientStep6Detail3'),
        t('howItWorksPage.clientStep6Detail4'),
        t('howItWorksPage.clientStep6Detail5'),
      ],
    },
  ];

  const PROVIDER_STEPS = [
    {
      number: '1',
      icon: '📝',
      title: t('howItWorksPage.providerStep1Title'),
      desc: t('howItWorksPage.providerStep1Desc'),
      details: [
        t('howItWorksPage.providerStep1Detail1'),
        t('howItWorksPage.providerStep1Detail2'),
        t('howItWorksPage.providerStep1Detail3'),
        t('howItWorksPage.providerStep1Detail4'),
        t('howItWorksPage.providerStep1Detail5'),
      ],
    },
    {
      number: '2',
      icon: '🛠️',
      title: t('howItWorksPage.providerStep2Title'),
      desc: t('howItWorksPage.providerStep2Desc'),
      details: [
        t('howItWorksPage.providerStep2Detail1'),
        t('howItWorksPage.providerStep2Detail2'),
        t('howItWorksPage.providerStep2Detail3'),
        t('howItWorksPage.providerStep2Detail4'),
        t('howItWorksPage.providerStep2Detail5'),
      ],
    },
    {
      number: '3',
      icon: '🔔',
      title: t('howItWorksPage.providerStep3Title'),
      desc: t('howItWorksPage.providerStep3Desc'),
      details: [
        t('howItWorksPage.providerStep3Detail1'),
        t('howItWorksPage.providerStep3Detail2'),
        t('howItWorksPage.providerStep3Detail3'),
        t('howItWorksPage.providerStep3Detail4'),
        t('howItWorksPage.providerStep3Detail5'),
      ],
    },
    {
      number: '4',
      icon: '✅',
      title: t('howItWorksPage.providerStep4Title'),
      desc: t('howItWorksPage.providerStep4Desc'),
      details: [
        t('howItWorksPage.providerStep4Detail1'),
        t('howItWorksPage.providerStep4Detail2'),
        t('howItWorksPage.providerStep4Detail3'),
        t('howItWorksPage.providerStep4Detail4'),
        t('howItWorksPage.providerStep4Detail5'),
      ],
    },
    {
      number: '5',
      icon: '🚗',
      title: t('howItWorksPage.providerStep5Title'),
      desc: t('howItWorksPage.providerStep5Desc'),
      details: [
        t('howItWorksPage.providerStep5Detail1'),
        t('howItWorksPage.providerStep5Detail2'),
        t('howItWorksPage.providerStep5Detail3'),
        t('howItWorksPage.providerStep5Detail4'),
        t('howItWorksPage.providerStep5Detail5'),
      ],
    },
    {
      number: '6',
      icon: '💼',
      title: t('howItWorksPage.providerStep6Title'),
      desc: t('howItWorksPage.providerStep6Desc'),
      details: [
        t('howItWorksPage.providerStep6Detail1'),
        t('howItWorksPage.providerStep6Detail2'),
        t('howItWorksPage.providerStep6Detail3'),
        t('howItWorksPage.providerStep6Detail4'),
        t('howItWorksPage.providerStep6Detail5'),
      ],
    },
    {
      number: '7',
      icon: '💰',
      title: t('howItWorksPage.providerStep7Title'),
      desc: t('howItWorksPage.providerStep7Desc'),
      details: [
        t('howItWorksPage.providerStep7Detail1'),
        t('howItWorksPage.providerStep7Detail2'),
        t('howItWorksPage.providerStep7Detail3'),
        t('howItWorksPage.providerStep7Detail4'),
        t('howItWorksPage.providerStep7Detail5'),
      ],
    },
  ];

  const CLIENT_FEATURES = [
    {
      icon: '🛡️',
      title: t('howItWorksPage.verifiedProviders'),
      desc: t('howItWorksPage.verifiedProvidersDesc'),
    },
    {
      icon: '🔄',
      title: t('howItWorksPage.flexibleCancellation'),
      desc: t('howItWorksPage.flexibleCancellationDesc'),
    },
    {
      icon: '💬',
      title: t('howItWorksPage.support247'),
      desc: t('howItWorksPage.support247Desc'),
    },
    {
      icon: '🔔',
      title: t('howItWorksPage.smartNotifications'),
      desc: t('howItWorksPage.smartNotificationsDesc'),
    },
  ];

  const PROVIDER_FEATURES = [
    {
      icon: '📊',
      title: t('howItWorksPage.completeDashboard'),
      desc: t('howItWorksPage.completeDashboardDesc'),
    },
    {
      icon: '⭐',
      title: t('howItWorksPage.ratingSystem'),
      desc: t('howItWorksPage.ratingSystemDesc'),
    },
    {
      icon: '🗺️',
      title: t('howItWorksPage.interventionZone'),
      desc: t('howItWorksPage.interventionZoneDesc'),
    },
    {
      icon: '🔄',
      title: t('howItWorksPage.cancellationManagement'),
      desc: t('howItWorksPage.cancellationManagementDesc'),
    },
  ];

  const PROVIDER_REVENUES = [
    {
      percent: '20%',
      title: t('howItWorksPage.commission'),
      desc: t('howItWorksPage.commissionDesc'),
    },
    {
      percent: '80%',
      title: t('howItWorksPage.yourEarnings'),
      desc: t('howItWorksPage.yourEarningsDesc'),
    },
    {
      percent: '100%',
      title: t('howItWorksPage.tips'),
      desc: t('howItWorksPage.tipsDesc'),
    },
  ];

  const CANCELLATION_POLICY = [
    { delay: t('howItWorksPage.moreThan2h'), fee: '0 MAD' },
    { delay: t('howItWorksPage.between1and2h'), fee: '20 MAD' },
    { delay: t('howItWorksPage.lessThan1h'), fee: '50 MAD' },
    { delay: t('howItWorksPage.noShow'), fee: '100 MAD' },
  ];

  const PRICING = [
    {
      formula: t('howItWorksPage.standard'),
      desc: t('howItWorksPage.standardDesc'),
      modifier: t('howItWorksPage.standardPrice'),
    },
    {
      formula: t('howItWorksPage.premium'),
      desc: t('howItWorksPage.premiumDesc'),
      modifier: t('howItWorksPage.premiumPrice'),
    },
    {
      formula: t('howItWorksPage.night'),
      desc: t('howItWorksPage.nightDesc'),
      modifier: t('howItWorksPage.nightPrice'),
    },
  ];

  const steps = activeTab === 'client' ? CLIENT_STEPS : PROVIDER_STEPS;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t('howItWorksPage.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.tabs, isRTL && styles.tabsRTL]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'client' && styles.tabActive]}
          onPress={() => setActiveTab('client')}
        >
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={[styles.tabText, activeTab === 'client' && styles.tabTextActive, isRTL && styles.textRTL]}>
            {t('howItWorksPage.tabClient')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'provider' && styles.tabActive]}
          onPress={() => setActiveTab('provider')}
        >
          <Text style={styles.tabIcon}>💼</Text>
          <Text style={[styles.tabText, activeTab === 'provider' && styles.tabTextActive, isRTL && styles.textRTL]}>
            {t('howItWorksPage.tabProvider')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
          {activeTab === 'client' ? t('howItWorksPage.clientTitle') : t('howItWorksPage.providerTitle')}
        </Text>
        <Text style={[styles.sectionSubtitle, isRTL && styles.textRTL]}>
          {activeTab === 'client'
            ? t('howItWorksPage.clientSubtitle')
            : t('howItWorksPage.providerSubtitle')}
        </Text>

        {steps.map((step, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <View style={styles.stepTitleContainer}>
                <Text style={[styles.stepTitle, isRTL && styles.textRTL]}>{step.title}</Text>
                <Text style={[styles.stepDesc, isRTL && styles.textRTL]}>{step.desc}</Text>
              </View>
            </View>
            <View style={[styles.stepDetails, isRTL && styles.stepDetailsRTL]}>
              {step.details.map((detail, i) => (
                <View key={i} style={[styles.detailRow, isRTL && styles.detailRowRTL]}>
                  <Text style={styles.detailBullet}>•</Text>
                  <Text style={[styles.detailText, isRTL && styles.textRTL]}>{detail}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {activeTab === 'client' ? t('howItWorksPage.clientAdvantages') : t('howItWorksPage.providerTools')}
          </Text>
          <View style={[styles.featuresGrid, isRTL && styles.featuresGridRTL]}>
            {(activeTab === 'client' ? CLIENT_FEATURES : PROVIDER_FEATURES).map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={[styles.featureTitle, isRTL && styles.textRTL]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, isRTL && styles.textRTL]}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Section - Client only */}
        {activeTab === 'client' && (
          <View style={styles.pricingSection}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('howItWorksPage.transparentPricing')}</Text>
            <Text style={[styles.sectionSubtitle, isRTL && styles.textRTL]}>{t('howItWorksPage.understandPricing')}</Text>
            {PRICING.map((item, index) => (
              <View key={index} style={[styles.pricingCard, isRTL && styles.pricingCardRTL]}>
                <View style={styles.pricingInfo}>
                  <Text style={[styles.pricingFormula, isRTL && styles.textRTL]}>{item.formula}</Text>
                  <Text style={[styles.pricingDesc, isRTL && styles.textRTL]}>{item.desc}</Text>
                </View>
                <Text style={styles.pricingModifier}>{item.modifier}</Text>
              </View>
            ))}
            <View style={[styles.pricingNote, isRTL && styles.pricingNoteRTL]}>
              <Text style={[styles.pricingNoteTitle, isRTL && styles.textRTL]}>{t('howItWorksPage.priceFormula')}</Text>
              <Text style={[styles.pricingNoteText, isRTL && styles.textRTL]}>
                {t('howItWorksPage.priceFormulaDetail')}
              </Text>
            </View>
          </View>
        )}

        {/* Revenues Section - Provider only */}
        {activeTab === 'provider' && (
          <View style={styles.pricingSection}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('howItWorksPage.yourRevenues')}</Text>
            <Text style={[styles.sectionSubtitle, isRTL && styles.textRTL]}>{t('howItWorksPage.fairPricing')}</Text>
            <View style={[styles.revenuesGrid, isRTL && styles.revenuesGridRTL]}>
              {PROVIDER_REVENUES.map((item, index) => (
                <View key={index} style={styles.revenueCard}>
                  <Text style={styles.revenuePercent}>{item.percent}</Text>
                  <Text style={[styles.revenueTitle, isRTL && styles.textRTL]}>{item.title}</Text>
                  <Text style={[styles.revenueDesc, isRTL && styles.textRTL]}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Cancellation Policy - Provider only */}
        {activeTab === 'provider' && (
          <View style={styles.pricingSection}>
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('howItWorksPage.cancellationPolicy')}</Text>
            <Text style={[styles.sectionSubtitle, isRTL && styles.textRTL]}>{t('howItWorksPage.cancellationSubtitle')}</Text>
            {CANCELLATION_POLICY.map((item, index) => (
              <View key={index} style={[styles.cancellationRow, isRTL && styles.cancellationRowRTL]}>
                <Text style={[styles.cancellationDelay, isRTL && styles.textRTL]}>{item.delay}</Text>
                <Text style={[
                  styles.cancellationFee,
                  item.fee === '0 MAD' && styles.cancellationFeeGreen
                ]}>{item.fee}</Text>
              </View>
            ))}
            <View style={[styles.pricingNote, isRTL && styles.pricingNoteRTL]}>
              <Text style={[styles.pricingNoteText, isRTL && styles.textRTL]}>
                {t('howItWorksPage.cancellationNote')}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.ctaSection}>
          <Text style={[styles.ctaTitle, isRTL && styles.textRTL]}>{t('howItWorksPage.readyToStart')}</Text>
          <Link href={activeTab === 'client' ? '/auth/signup-client' : '/auth/signup-provider'} asChild>
            <TouchableOpacity style={styles.ctaButton}>
              <Text style={[styles.ctaButtonText, isRTL && styles.textRTL]}>
                {activeTab === 'client' ? t('howItWorksPage.createClientAccount') : t('howItWorksPage.becomeProvider')}
              </Text>
            </TouchableOpacity>
          </Link>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.backLink}>
              <Text style={[styles.backLinkText, isRTL && styles.textRTL]}>{t('howItWorksPage.backToHome')}</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: colors.gray[900],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 36,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
  },
  tabTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
  },
  stepCard: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  stepIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  stepTitleContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  stepDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  stepDetails: {
    marginLeft: 36,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  detailBullet: {
    fontSize: 14,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    flex: 1,
  },
  featuresSection: {
    marginTop: spacing.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  featureTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    textAlign: 'center',
  },
  pricingSection: {
    marginTop: spacing.lg,
  },
  pricingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pricingInfo: {
    flex: 1,
  },
  pricingFormula: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  pricingDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  pricingModifier: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary,
  },
  pricingNote: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  pricingNoteTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  pricingNoteText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  revenuesGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  revenuePercent: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  revenueTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 2,
  },
  revenueDesc: {
    fontSize: 10,
    color: colors.gray[500],
    textAlign: 'center',
  },
  cancellationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  cancellationDelay: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  cancellationFee: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.error,
  },
  cancellationFeeGreen: {
    color: colors.success,
  },
  ctaSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  ctaTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  ctaButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  backLink: {
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    color: colors.gray[500],
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },

  // RTL Styles
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  tabsRTL: {
    flexDirection: 'row-reverse',
  },
  stepHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  stepDetailsRTL: {
    marginLeft: 0,
    marginRight: 36,
  },
  detailRowRTL: {
    flexDirection: 'row-reverse',
  },
  featuresGridRTL: {
    flexDirection: 'row-reverse',
  },
  pricingCardRTL: {
    flexDirection: 'row-reverse',
  },
  pricingNoteRTL: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  revenuesGridRTL: {
    flexDirection: 'row-reverse',
  },
  cancellationRowRTL: {
    flexDirection: 'row-reverse',
  },
});
