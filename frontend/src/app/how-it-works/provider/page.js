'use client';

import Link from 'next/link';
import styles from '../page.module.scss';
import Button from '@/components/Button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HowItWorksProviderPage() {
  const { t, isRTL } = useLanguage();

  const steps = [
    { number: '1', icon: '📝', titleKey: 'howItWorksProvider.step1Title', descKey: 'howItWorksProvider.step1Desc', detailsKeys: ['howItWorksProvider.step1Detail1', 'howItWorksProvider.step1Detail2', 'howItWorksProvider.step1Detail3', 'howItWorksProvider.step1Detail4', 'howItWorksProvider.step1Detail5'] },
    { number: '2', icon: '🛠️', titleKey: 'howItWorksProvider.step2Title', descKey: 'howItWorksProvider.step2Desc', detailsKeys: ['howItWorksProvider.step2Detail1', 'howItWorksProvider.step2Detail2', 'howItWorksProvider.step2Detail3', 'howItWorksProvider.step2Detail4', 'howItWorksProvider.step2Detail5'] },
    { number: '3', icon: '🔔', titleKey: 'howItWorksProvider.step3Title', descKey: 'howItWorksProvider.step3Desc', detailsKeys: ['howItWorksProvider.step3Detail1', 'howItWorksProvider.step3Detail2', 'howItWorksProvider.step3Detail3', 'howItWorksProvider.step3Detail4', 'howItWorksProvider.step3Detail5'] },
    { number: '4', icon: '✅', titleKey: 'howItWorksProvider.step4Title', descKey: 'howItWorksProvider.step4Desc', detailsKeys: ['howItWorksProvider.step4Detail1', 'howItWorksProvider.step4Detail2', 'howItWorksProvider.step4Detail3', 'howItWorksProvider.step4Detail4', 'howItWorksProvider.step4Detail5'] },
    { number: '5', icon: '🚗', titleKey: 'howItWorksProvider.step5Title', descKey: 'howItWorksProvider.step5Desc', detailsKeys: ['howItWorksProvider.step5Detail1', 'howItWorksProvider.step5Detail2', 'howItWorksProvider.step5Detail3', 'howItWorksProvider.step5Detail4', 'howItWorksProvider.step5Detail5'] },
    { number: '6', icon: '💼', titleKey: 'howItWorksProvider.step6Title', descKey: 'howItWorksProvider.step6Desc', detailsKeys: ['howItWorksProvider.step6Detail1', 'howItWorksProvider.step6Detail2', 'howItWorksProvider.step6Detail3', 'howItWorksProvider.step6Detail4', 'howItWorksProvider.step6Detail5'] },
    { number: '7', icon: '💰', titleKey: 'howItWorksProvider.step7Title', descKey: 'howItWorksProvider.step7Desc', detailsKeys: ['howItWorksProvider.step7Detail1', 'howItWorksProvider.step7Detail2', 'howItWorksProvider.step7Detail3', 'howItWorksProvider.step7Detail4', 'howItWorksProvider.step7Detail5'] }
  ];

  const features = [
    { icon: '📊', titleKey: 'howItWorksProvider.feature1Title', descKey: 'howItWorksProvider.feature1Desc' },
    { icon: '⭐', titleKey: 'howItWorksProvider.feature2Title', descKey: 'howItWorksProvider.feature2Desc' },
    { icon: '🗺️', titleKey: 'howItWorksProvider.feature3Title', descKey: 'howItWorksProvider.feature3Desc' },
    { icon: '🔄', titleKey: 'howItWorksProvider.feature4Title', descKey: 'howItWorksProvider.feature4Desc' }
  ];

  const earnings = [
    { titleKey: 'howItWorksProvider.earning1Title', value: '20%', descKey: 'howItWorksProvider.earning1Desc' },
    { titleKey: 'howItWorksProvider.earning2Title', value: '80%', descKey: 'howItWorksProvider.earning2Desc' },
    { titleKey: 'howItWorksProvider.earning3Title', value: '100%', descKey: 'howItWorksProvider.earning3Desc' }
  ];

  const cancellationFees = [
    { delayKey: 'howItWorksProvider.cancel1Delay', fee: '0 MAD', color: '#22c55e' },
    { delayKey: 'howItWorksProvider.cancel2Delay', fee: '20 MAD', color: '#f59e0b' },
    { delayKey: 'howItWorksProvider.cancel3Delay', fee: '50 MAD', color: '#ef4444' },
    { delayKey: 'howItWorksProvider.cancel4Delay', fee: '100 MAD', color: '#dc2626' }
  ];

  return (
    <div className={styles.howItWorksPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroTabs}>
            <Link href="/how-it-works/client" className={styles.heroTab}>
              👤 {t('howItWorksClient.tabClient')}
            </Link>
            <Link href="/how-it-works/provider" className={`${styles.heroTab} ${styles.active}`}>
              💼 {t('howItWorksClient.tabProvider')}
            </Link>
          </div>
          <h1 className={styles.title}>{t('howItWorksProvider.heroTitle')}</h1>
          <p className={styles.subtitle}>{t('howItWorksProvider.heroSubtitle')}</p>
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
                  {step.detailsKeys.map((key, i) => (
                    <li key={i}>{t(key)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.earningsSection}>
          <h2 className={styles.sectionTitle}>{t('howItWorksProvider.earningsTitle')}</h2>
          <p className={styles.sectionSubtitle}>{t('howItWorksProvider.earningsSubtitle')}</p>
          <div className={styles.earningsGrid}>
            {earnings.map((item, index) => (
              <div key={index} className={styles.earningCard}>
                <div className={styles.earningValue}>{item.value}</div>
                <h3>{t(item.titleKey)}</h3>
                <p>{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.cancellationSection}>
          <h2 className={styles.sectionTitle}>{t('howItWorksProvider.cancellationTitle')}</h2>
          <p className={styles.sectionSubtitle}>{t('howItWorksProvider.cancellationSubtitle')}</p>
          <div className={styles.cancellationGrid}>
            {cancellationFees.map((item, index) => (
              <div key={index} className={styles.cancellationCard} style={{ borderLeftColor: item.color }}>
                <span className={styles.cancellationDelay}>{t(item.delayKey)}</span>
                <span className={styles.cancellationFee} style={{ color: item.color }}>{item.fee}</span>
              </div>
            ))}
          </div>
          <div className={styles.cancellationNote}>
            <p>{t('howItWorksProvider.cancellationNote')}</p>
          </div>
        </section>

        <section className={styles.benefitsSection}>
          <h2 className={styles.sectionTitle}>{t('howItWorksProvider.toolsTitle')}</h2>
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
            <h2>{t('howItWorksProvider.ctaTitle')}</h2>
            <p>{t('howItWorksProvider.ctaSubtitle')}</p>
            <div className={styles.ctaButtons}>
              <Link href="/provider/register">
                <Button variant="primary" size="large">
                  {t('howItWorksProvider.ctaBecome')}
                </Button>
              </Link>
              <Link href="/provider/login">
                <Button variant="outline" size="large">
                  {t('howItWorksProvider.ctaLogin')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
