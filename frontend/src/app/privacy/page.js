'use client';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import './privacy.scss';

export default function PrivacyPage() {
  const { t, language } = useLanguage();

  return (
    <div className="privacy-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="privacy-container">
        <Link href="/" className="back-link">← {t('privacy.backLink')}</Link>

        <h1>{t('privacy.title')}</h1>
        <p className="last-update">{t('privacy.lastUpdate')}</p>

        <section>
          <h2>{t('privacy.section1Title')}</h2>
          <p>{t('privacy.section1Content')}</p>
          <ul>
            <li>{t('privacy.section1Item1')}</li>
            <li>{t('privacy.section1Item2')}</li>
            <li>{t('privacy.section1Item3')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('privacy.section2Title')}</h2>
          <p>{t('privacy.section2Content')}</p>
          <ul>
            <li>{t('privacy.section2Item1')}</li>
            <li>{t('privacy.section2Item2')}</li>
            <li>{t('privacy.section2Item3')}</li>
            <li>{t('privacy.section2Item4')}</li>
            <li>{t('privacy.section2Item5')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('privacy.section3Title')}</h2>
          <p>{t('privacy.section3Content')}</p>
          <ul>
            <li>{t('privacy.section3Item1')}</li>
            <li>{t('privacy.section3Item2')}</li>
            <li>{t('privacy.section3Item3')}</li>
          </ul>
          <p>{t('privacy.section3Note')}</p>
        </section>

        <section>
          <h2>{t('privacy.section4Title')}</h2>
          <p>{t('privacy.section4Content')}</p>
        </section>

        <section>
          <h2>{t('privacy.section5Title')}</h2>
          <p>{t('privacy.section5Content')}</p>
          <ul>
            <li>{t('privacy.section5Item1')}</li>
            <li>{t('privacy.section5Item2')}</li>
            <li>{t('privacy.section5Item3')}</li>
            <li>{t('privacy.section5Item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('privacy.section6Title')}</h2>
          <p>{t('privacy.section6Content')}</p>
        </section>

        <section>
          <h2>{t('privacy.section7Title')}</h2>
          <p>{t('privacy.section7Content')}</p>
        </section>

        <section>
          <h2>{t('privacy.section8Title')}</h2>
          <p>
            {t('privacy.section8Content')}
            <br />
            {t('privacy.section8Email')}
          </p>
        </section>
      </div>
    </div>
  );
}
