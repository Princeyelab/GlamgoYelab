import '../styles/globals.scss';
import '../styles/globals.css';
import { Inter, Poppins, Noto_Sans_Arabic } from 'next/font/google';
import ClientLayout from '@/components/ClientLayout';

// Charger les polices du Design System GlamGo avec next/font pour optimisation
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

// Charger la police arabe avec next/font pour optimisation
// La police ne sera chargée que lorsqu'elle sera utilisée (lazy loading)
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic',
  preload: false, // Désactiver le preload car utilisé uniquement pour l'arabe
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
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${poppins.variable} ${notoSansArabic.variable}`}
    >
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
