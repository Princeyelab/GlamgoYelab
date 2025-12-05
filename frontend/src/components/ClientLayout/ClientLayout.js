'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import ChatBot from '@/components/ChatBot';

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
      <AuthProvider>
        <CurrencyProvider>
          {!isProviderPage && <Header />}
          <main>{children}</main>
          <ChatBot />
        </CurrencyProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
