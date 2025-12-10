'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProviderBiddingPage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    // Le système d'enchères est désactivé - rediriger vers le dashboard
    router.push('/provider/dashboard');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
      <div>
        <h1>{t('providerBidding.disabled')}</h1>
        <p>{t('providerBidding.notAvailable')}</p>
        <p>{t('providerBidding.redirecting')}</p>
      </div>
    </div>
  );
}
