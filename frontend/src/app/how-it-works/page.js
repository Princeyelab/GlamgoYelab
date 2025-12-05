import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Comment ça marche - GlamGo',
  description: 'Découvrez comment utiliser GlamGo, que vous soyez client ou prestataire.',
};

export default function HowItWorksPage() {
  // Rediriger vers la page client par défaut
  redirect('/how-it-works/client');
}
