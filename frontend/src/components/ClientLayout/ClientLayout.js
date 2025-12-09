'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Header } from '@/components/layouts';
import { BottomNav } from '@/components/ui/BottomNav';
import ChatBot from '@/components/ChatBot';
import NavigationProgress from '@/components/NavigationProgress';

/**
 * ClientLayout - Wrapper pour les composants clients
 * Isole les client components du root layout pour permettre
 * au reste de l'app de bénéficier des Server Components
 *
 * Architecture Responsive :
 * - Mobile < 768px : BottomNav uniquement (Header masqué)
 * - Tablet/Desktop >= 768px : Header visible, BottomNav masqué
 */
export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Ne pas afficher le Header/BottomNav sur les pages prestataires
  const isProviderPage = pathname?.startsWith('/provider');

  return (
    <LanguageProvider>
      <AuthProvider>
        <CurrencyProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {!isProviderPage && (
            <>
              {/* Header Desktop/Tablet (masqué mobile < 768px) */}
              <Header />
              {/* BottomNav Mobile (masqué >= 768px) */}
              <BottomNav />
            </>
          )}
          <main>{children}</main>
          <ChatBot />
        </CurrencyProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
