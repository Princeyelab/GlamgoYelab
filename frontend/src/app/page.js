import WelcomePopup from '@/components/WelcomePopup/WelcomePopup';
import HomeContent from '@/components/HomeContent/HomeContent';
import { getCategories, getAllServices } from '@/lib/serverApi';

export const metadata = {
  title: 'GlamGo - Services à domicile à Marrakech',
  description: 'Réservez vos services à domicile à Marrakech en quelques clics. Beauté, ménage, réparations et plus encore.',
};

// Configuration de la page pour revalidation
export const revalidate = 300; // 5 minutes

export default async function Home() {
  // Fetch des données côté serveur (SSR) avec cache - gestion d'erreurs
  let allCategories = [];
  let allServices = [];

  try {
    [allCategories, allServices] = await Promise.all([
      getCategories(),
      getAllServices(),
    ]);
  } catch (error) {
    console.error('Erreur chargement données:', error.message);
    // Continuer avec des tableaux vides si le backend n'est pas disponible
  }

  // Catégories populaires dans l'ordre souhaité
  const popularCategoryNames = ['maison', 'beaute', 'voiture', 'bien-etre', 'animaux'];

  // Fonction pour normaliser le nom de catégorie pour la comparaison
  const normalizeForComparison = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Filtrer et ordonner les catégories populaires
  const categories = popularCategoryNames
    .map(popName => {
      return allCategories.find(cat => {
        const catSlug = cat.slug || normalizeForComparison(cat.name);
        const normalizedCatName = normalizeForComparison(cat.name);
        return catSlug === popName ||
               normalizedCatName === popName ||
               catSlug.includes(popName) ||
               normalizedCatName.includes(popName);
      });
    })
    .filter(Boolean); // Enlever les undefined

  // Si pas assez de catégories populaires trouvées, compléter avec les autres
  if (categories.length < 5) {
    const remainingCategories = allCategories
      .filter(cat => !categories.find(c => c.id === cat.id))
      .slice(0, 5 - categories.length);
    categories.push(...remainingCategories);
  }

  const services = allServices.slice(0, 6);

  return (
    <>
      <WelcomePopup />
      <HomeContent categories={categories} services={services} />
    </>
  );
}
