import { Noto_Sans_Arabic } from 'next/font/google';
import '../styles/globals.scss';
import ClientLayout from '@/components/ClientLayout';

// Chargement optimisé de la police arabe via next/font
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic',
  preload: true,
});

export const metadata = {
  title: 'GlamGo - Services à domicile à Marrakech',
  description: 'Réservez vos services à domicile à Marrakech en quelques clics. Beauté, ménage, réparations et plus encore.',
};

/**
 * Root Layout - Server Component optimisé
 * Les client components (AuthProvider, Header) sont isolés dans ClientLayout
 * pour maximiser les performances HMR et SSR
 */
export default function RootLayout({ children }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" className={notoSansArabic.variable}>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
