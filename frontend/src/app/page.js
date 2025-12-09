'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Star,
  Users,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Home as HomeIcon,
  Car,
  Scissors,
  Zap,
  Heart,
  PawPrint,
  Wrench,
  ChefHat,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardImage,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BottomNav, BottomNavSpacer } from '@/components/ui/BottomNav';

// Mock data - Categories principales
const CATEGORIES = [
  {
    id: 1,
    name: 'Maison',
    slug: 'maison',
    icon: HomeIcon,
    color: 'bg-blue-500',
    count: 12,
  },
  {
    id: 2,
    name: 'Beauté',
    slug: 'beaute',
    icon: Sparkles,
    color: 'bg-pink-500',
    count: 18,
  },
  {
    id: 3,
    name: 'Voiture',
    slug: 'voiture',
    icon: Car,
    color: 'bg-indigo-500',
    count: 8,
  },
  {
    id: 4,
    name: 'Coiffure',
    slug: 'coiffure',
    icon: Scissors,
    color: 'bg-purple-500',
    count: 10,
  },
  {
    id: 5,
    name: 'Bien-être',
    slug: 'bien-etre',
    icon: Heart,
    color: 'bg-red-500',
    count: 15,
  },
  {
    id: 6,
    name: 'Animaux',
    slug: 'animaux',
    icon: PawPrint,
    color: 'bg-green-500',
    count: 6,
  },
  {
    id: 7,
    name: 'Réparation',
    slug: 'reparation',
    icon: Wrench,
    color: 'bg-orange-500',
    count: 9,
  },
  {
    id: 8,
    name: 'Chef',
    slug: 'chef',
    icon: ChefHat,
    color: 'bg-yellow-500',
    count: 5,
  },
];

// Mock data - Services populaires
const POPULAR_SERVICES = [
  {
    id: 1,
    name: 'Coiffure à domicile',
    description: 'Coupe, coloration, brushing par des professionnels',
    price: 150,
    image: '/images/services/coiffure-classique.jpg',
    rating: 4.8,
    reviews: 234,
    isPopular: true,
    category: 'Beauté',
  },
  {
    id: 2,
    name: 'Massage relaxant',
    description: 'Massage complet du corps pour une détente absolue',
    price: 200,
    image: '/images/services/massage-relaxant.jpg',
    rating: 4.9,
    reviews: 189,
    isPopular: true,
    category: 'Bien-être',
  },
  {
    id: 3,
    name: 'Nettoyage maison',
    description: 'Nettoyage complet de votre maison par des experts',
    price: 120,
    image: '/images/services/nettoyage-maison.jpg',
    rating: 4.7,
    reviews: 456,
    isPopular: true,
    category: 'Maison',
  },
  {
    id: 4,
    name: 'Lavage auto premium',
    description: 'Nettoyage intérieur et extérieur de votre véhicule',
    price: 180,
    image: '/images/services/nettoyage-auto-complet.jpg',
    rating: 4.6,
    reviews: 312,
    isPopular: true,
    category: 'Voiture',
  },
  {
    id: 5,
    name: 'Promenade animaux',
    description: 'Promenade sécurisée pour vos animaux de compagnie',
    price: 80,
    image: '/images/services/promenade-animaux.jpg',
    rating: 4.9,
    reviews: 178,
    isPopular: true,
    category: 'Animaux',
  },
  {
    id: 6,
    name: 'Chef à domicile',
    description: 'Chef professionnel pour vos repas et événements',
    price: 350,
    image: '/images/services/chef-domicile-2.jpg',
    rating: 5.0,
    reviews: 92,
    isPopular: true,
    category: 'Chef',
  },
];

// Stats
const STATS = [
  {
    icon: Users,
    value: '500+',
    label: 'Prestataires vérifiés',
    color: 'text-primary',
  },
  {
    icon: CheckCircle,
    value: '10K+',
    label: 'Services effectués',
    color: 'text-accent',
  },
  {
    icon: Star,
    value: '4.8/5',
    label: 'Note moyenne',
    color: 'text-secondary',
  },
  {
    icon: TrendingUp,
    value: '95%',
    label: 'Clients satisfaits',
    color: 'text-primary',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/services?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-white to-accent/5 pt-8 pb-12 md:pt-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Content */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              Vos services à domicile
              <br />
              <span className="text-primary">en quelques clics</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Réservez des professionnels vérifiés pour tous vos besoins quotidiens à Marrakech
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative flex items-center bg-white rounded-full shadow-lg border-2 border-gray-100 hover:border-primary/30 transition-colors duration-200">
                <Search className="absolute left-6 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un service (coiffure, massage, ménage...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-14 py-4 md:py-5 text-base md:text-lg rounded-full focus:outline-none"
                />
                <button
                  type="submit"
                  className="mr-2 px-6 md:px-8 py-3 md:py-4 bg-primary text-white rounded-full font-semibold hover:bg-primary-hover transition-colors duration-200"
                >
                  Rechercher
                </button>
              </div>
            </form>

            {/* Location Badge */}
            <div className="flex items-center justify-center gap-2 mt-4 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Marrakech</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Catégories populaires
            </h2>
            <Link
              href="/services"
              className="text-primary font-semibold hover:text-primary-hover transition-colors"
            >
              Voir tout
            </Link>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="overflow-x-auto -mx-4 px-4 md:overflow-visible">
            <div className="flex gap-4 md:grid md:grid-cols-4 lg:grid-cols-8 md:gap-6 min-w-max md:min-w-0">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.id}
                    href={`/services?category=${category.slug}`}
                    className="flex-shrink-0 w-24 md:w-auto"
                  >
                    <div className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
                      <div
                        className={`w-16 h-16 ${category.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200 shadow-md`}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {category.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {category.count} services
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Services Populaires */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Services populaires
              </h2>
              <p className="text-gray-600">Les services les plus demandés ce mois-ci</p>
            </div>
            <Link
              href="/services"
              className="text-primary font-semibold hover:text-primary-hover transition-colors"
            >
              Voir tout
            </Link>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="overflow-x-auto -mx-4 px-4 md:overflow-visible">
            <div className="flex gap-6 md:grid md:grid-cols-2 lg:grid-cols-3 min-w-max md:min-w-0">
              {POPULAR_SERVICES.map((service) => (
                <Link
                  key={service.id}
                  href={`/services/${service.id}`}
                  className="flex-shrink-0 w-80 md:w-auto"
                >
                  <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {service.isPopular && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="primary" size="sm">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Populaire
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                          {service.name}
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {service.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-900">
                            {service.rating}
                          </span>
                          <span className="text-gray-500">
                            ({service.reviews})
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">À partir de</p>
                          <p className="text-lg font-bold text-primary">
                            {service.price} MAD
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Stats */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Pourquoi choisir GlamGo ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              La plateforme de confiance pour tous vos services à domicile à Marrakech
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {STATS.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-lg bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center ${stat.color}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>
                  <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm md:text-base text-gray-600">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary via-primary-hover to-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à simplifier votre quotidien ?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers de clients satisfaits et découvrez nos services
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push('/services')}
              className="w-full sm:w-auto shadow-xl"
            >
              <Search className="w-5 h-5" />
              Explorer les services
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/provider/register')}
              className="w-full sm:w-auto bg-white/10 text-white border-white hover:bg-white hover:text-primary"
            >
              <Users className="w-5 h-5" />
              Devenir prestataire
            </Button>
          </div>
        </div>
      </section>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
      <BottomNavSpacer />
    </div>
  );
}
