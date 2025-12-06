'use client';

import Link from 'next/link';
import styles from '../page.module.scss';
import Button from '@/components/Button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HowItWorksClientPage() {
  const { t, language, isRTL } = useLanguage();

  const steps = [
    {
      number: '1',
      icon: '📱',
      titleKey: 'howItWorksClient.step1Title',
      descKey: 'howItWorksClient.step1Desc',
      detailsKeys: [
        'howItWorksClient.step1Detail1',
        'howItWorksClient.step1Detail2',
        'howItWorksClient.step1Detail3',
        'howItWorksClient.step1Detail4'
      ]
    },
    {
      number: '2',
      icon: '🔍',
      titleKey: 'howItWorksClient.step2Title',
      descKey: 'howItWorksClient.step2Desc',
      detailsKeys: [
        'howItWorksClient.step2Detail1',
        'howItWorksClient.step2Detail2',
        'howItWorksClient.step2Detail3',
        'howItWorksClient.step2Detail4'
      ]
    },
    {
      number: '3',
      icon: '📅',
      titleKey: 'howItWorksClient.step3Title',
      descKey: 'howItWorksClient.step3Desc',
      detailsKeys: [
        'howItWorksClient.step3Detail1',
        'howItWorksClient.step3Detail2',
        'howItWorksClient.step3Detail3',
        'howItWorksClient.step3Detail4',
        'howItWorksClient.step3Detail5'
      ]
    },
    {
      number: '4',
      icon: '💳',
      titleKey: 'howItWorksClient.step4Title',
      descKey: 'howItWorksClient.step4Desc',
      detailsKeys: [
        'howItWorksClient.step4Detail1',
        'howItWorksClient.step4Detail2',
        'howItWorksClient.step4Detail3',
        'howItWorksClient.step4Detail4',
        'howItWorksClient.step4Detail5'
      ]
    },
    {
      number: '5',
      icon: '📍',
      titleKey: 'howItWorksClient.step5Title',
      descKey: 'howItWorksClient.step5Desc',
      detailsKeys: [
        'howItWorksClient.step5Detail1',
        'howItWorksClient.step5Detail2',
        'howItWorksClient.step5Detail3',
        'howItWorksClient.step5Detail4',
        'howItWorksClient.step5Detail5'
      ]
    },
    {
      number: '6',
      icon: '⭐',
      titleKey: 'howItWorksClient.step6Title',
      descKey: 'howItWorksClient.step6Desc',
      detailsKeys: [
        'howItWorksClient.step6Detail1',
        'howItWorksClient.step6Detail2',
        'howItWorksClient.step6Detail3',
        'howItWorksClient.step6Detail4',
        'howItWorksClient.step6Detail5'
      ]
    }
  ];

  const features = [
    {
      icon: '🛡️',
      titleKey: 'howItWorksClient.feature1Title',
      descKey: 'howItWorksClient.feature1Desc'
    },
    {
      icon: '🔄',
      titleKey: 'howItWorksClient.feature2Title',
      descKey: 'howItWorksClient.feature2Desc'
    },
    {
      icon: '💬',
      titleKey: 'howItWorksClient.feature3Title',
      descKey: 'howItWorksClient.feature3Desc'
    },
    {
      icon: '🔔',
      titleKey: 'howItWorksClient.feature4Title',
      descKey: 'howItWorksClient.feature4Desc'
    }
  ];

  const pricing = [
    {
      formulaKey: 'howItWorksClient.pricingStandard',
      descKey: 'howItWorksClient.pricingStandardDesc',
      modifier: t('howItWorksClient.basePrice')
    },
    {
      formulaKey: 'howItWorksClient.pricingPremium',
      descKey: 'howItWorksClient.pricingPremiumDesc',
      modifier: '+50 MAD'
    },
    {
      formulaKey: 'howItWorksClient.pricingNight',
      descKey: 'howItWorksClient.pricingNightDesc',
      modifier: '+30 MAD'
    }
  ];

  return (
    <div className={styles.howItWorksPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroTabs}>
            <Link href="/how-it-works/client" className={`${styles.heroTab} ${styles.active}`}>
              👤 {t('howItWorksClient.tabClient')}
            </Link>
            <Link href="/how-it-works/provider" className={styles.heroTab}>
              💼 {t('howItWorksClient.tabProvider')}
            </Link>
          </div>
          <h1 className={styles.title}>{t('howItWorksClient.heroTitle')}</h1>
          <p className={styles.subtitle}>{t('howItWorksClient.heroSubtitle')}</p>
        </div>
      </section>

      <div className="container">
        <section className={styles.stepsSection}>
          <div className={styles.steps}>
            {steps.map((step, index) => (
              <div key={index} className={styles.stepCard}>
                <div className={styles.stepNumber}>{step.number}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h2 className={styles.stepTitle}>{t(step.titleKey)}</h2>
                <p className={styles.stepDescription}>{t(step.descKey)}</p>
                <ul className={styles.stepDetails}>
                  {step.detailsKeys.map((detailKey, i) => (
                    <li key={i}>{t(detailKey)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.pricingSection}>
          <h2 className={styles.sectionTitle}>{t('howItWorksClient.pricingTitle')}</h2>
          <p className={styles.sectionSubtitle}>{t('howItWorksClient.pricingSubtitle')}</p>
          <div className={styles.pricingGrid}>
            {pricing.map((item, index) => (
              <div key={index} className={styles.pricingCard}>
                <h3>{t(item.formulaKey)}</h3>
                <p>{t(item.descKey)}</p>
                <span className={styles.pricingModifier}>{item.modifier}</span>
              </div>
            ))}
          </div>
          <div className={styles.pricingNote}>
            <strong>{t('howItWorksClient.pricingCalculation')}</strong>
            <p>{t('howItWorksClient.pricingFormula')}</p>
          </div>
        </section>

        <section className={styles.benefitsSection}>
          <h2 className={styles.sectionTitle}>{t('howItWorksClient.benefitsTitle')}</h2>
          <div className={styles.benefitsGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>{feature.icon}</div>
                <h3 className={styles.benefitTitle}>{t(feature.titleKey)}</h3>
                <p className={styles.benefitDescription}>{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.cta}>
            <h2>{t('howItWorksClient.ctaTitle')}</h2>
            <p>{t('howItWorksClient.ctaSubtitle')}</p>
            <div className={styles.ctaButtons}>
              <Link href="/services">
                <Button variant="primary" size="large">
                  {t('howItWorksClient.ctaDiscover')}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="large">
                  {t('howItWorksClient.ctaRegister')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
