'use client';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import './terms.scss';

export default function TermsPage() {
  const { t, language } = useLanguage();

  return (
    <div className="terms-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="terms-container">
        <Link href="/" className="back-link">← {t('terms.backLink')}</Link>

        <h1>{t('terms.title')}</h1>
        <p className="last-update">{t('terms.lastUpdate')}</p>

        <section>
          <h2>{t('terms.section1Title')}</h2>
          <p>{t('terms.section1Content')}</p>
        </section>

        <section>
          <h2>{t('terms.section2Title')}</h2>
          <p>{t('terms.section2Content')}</p>
          <ul>
            <li>{t('terms.section2Item1')}</li>
            <li>{t('terms.section2Item2')}</li>
            <li>{t('terms.section2Item3')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('terms.section3Title')}</h2>
          <p>{t('terms.section3Content')}</p>
          <ul>
            <li>{t('terms.section3Item1')}</li>
            <li>{t('terms.section3Item2')}</li>
            <li>{t('terms.section3Item3')}</li>
            <li>{t('terms.section3Item4')}</li>
            <li>{t('terms.section3Item5')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('terms.section4Title')}</h2>
          <p>{t('terms.section4Content')}</p>
        </section>

        <section>
          <h2>{t('terms.section5Title')}</h2>
          <p>{t('terms.section5Content')}</p>
          <ul>
            <li>{t('terms.section5Item1')}</li>
            <li>{t('terms.section5Item2')}</li>
            <li>{t('terms.section5Item3')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('terms.section6Title')}</h2>
          <p>{t('terms.section6Content')}</p>
        </section>

        <section>
          <h2>{t('terms.section7Title')}</h2>
          <p>{t('terms.section7Content')}</p>
        </section>

        <section>
          <h2>{t('terms.section8Title')}</h2>
          <p>
            {t('terms.section8Content')}
            <br />
            {t('terms.section8Email')}
          </p>
        </section>
      </div>
    </div>
  );
}
