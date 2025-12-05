import { Suspense } from 'react';
import styles from './page.module.scss';
import ServicesFilter from '@/components/ServicesFilter';
import ServicesHero, { ServicesLoading } from '@/components/ServicesHero';
import { getCategories, getAllServices } from '@/lib/serverApi';

export const metadata = {
  title: 'Services - GlamGo',
  description: 'Découvrez notre large gamme de services à domicile à Marrakech',
};

// Configuration de la page pour revalidation
export const revalidate = 300; // 5 minutes

async function ServicesContent({ searchParams }) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  // Fetch des données côté serveur (SSR) - gestion d'erreurs
  let categories = [];
  let services = [];

  try {
    [categories, services] = await Promise.all([
      getCategories(),
      getAllServices(),
    ]);
  } catch (error) {
    console.error('Erreur chargement données:', error.message);
    // Continuer avec des tableaux vides si le backend n'est pas disponible
  }

  const initialCategoryId = params?.category || 'all';
  const initialSearch = params?.search || '';

  return (
    <div className="container">
      <ServicesFilter
        services={services}
        categories={categories}
        initialCategoryId={initialCategoryId}
        initialSearch={initialSearch}
      />
    </div>
  );
}

export default function ServicesPage({ searchParams }) {
  return (
    <div className={styles.servicesPage}>
      <ServicesHero />

      <Suspense fallback={<div className="container"><ServicesLoading /></div>}>
        <ServicesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
