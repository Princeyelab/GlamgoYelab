'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import ChatBot from '@/components/ChatBot';
import NavigationProgress from '@/components/NavigationProgress';
import HtmlWrapper from '@/components/HtmlWrapper';

/**
 * ClientLayout - Wrapper pour les composants clients
 * Isole les client components du root layout pour permettre
 * au reste de l'app de bénéficier des Server Components
 */
export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Ne pas afficher le Header sur les pages prestataires
  const isProviderPage = pathname?.startsWith('/provider');

  return (
    <LanguageProvider>
      <HtmlWrapper />
      <AuthProvider>
        <CurrencyProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {!isProviderPage && <Header />}
          <main>{children}</main>
          <ChatBot />
        </CurrencyProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
