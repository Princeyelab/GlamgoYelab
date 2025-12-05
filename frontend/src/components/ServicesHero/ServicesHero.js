'use client';

import Link from 'next/link';
import styles from './ServicesHero.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ServicesHero() {
  const { t } = useLanguage();

  return (
    <section className={styles.hero}>
      <div className="container">
        <h1 className={styles.title}>{t('services.allServices')}</h1>
        <p className={styles.subtitle}>
          {t('services.subtitle')}
        </p>
        <Link href="/formulas" className={styles.formulasLink}>
          {t('services.discoverFormulas')}
        </Link>
      </div>
    </section>
  );
}

export function ServicesLoading() {
  const { t } = useLanguage();

  return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>{t('services.loading')}</p>
    </div>
  );
}
