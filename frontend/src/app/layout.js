import '../styles/globals.scss';
import ClientLayout from '@/components/ClientLayout';

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
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
