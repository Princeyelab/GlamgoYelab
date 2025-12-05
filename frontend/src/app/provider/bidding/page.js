'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProviderBiddingPage() {
  const router = useRouter();

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
      textAlign: 'center'
    }}>
      <div>
        <h1>🚫 Fonctionnalité désactivée</h1>
        <p>Le système d'enchères n'est plus disponible.</p>
        <p>Redirection vers le dashboard...</p>
      </div>
    </div>
  );
}
