import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Link } from 'expo-router';
// UI Components
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import Card from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Skeleton from '../src/components/ui/Skeleton';
import Modal from '../src/components/ui/Modal';
// Feature Components
import ServiceCard from '../src/components/features/ServiceCard';
import CategoryCard from '../src/components/features/CategoryCard';
import BookingCard from '../src/components/features/BookingCard';
import ProviderCard from '../src/components/features/ProviderCard';
import SkeletonProviderCard from '../src/components/features/SkeletonProviderCard';
import SkeletonServiceCard from '../src/components/features/SkeletonServiceCard';
import SkeletonCategoryCard from '../src/components/features/SkeletonCategoryCard';
import SkeletonBookingCard from '../src/components/features/SkeletonBookingCard';
import ReviewCard from '../src/components/features/ReviewCard';
import SkeletonReviewCard from '../src/components/features/SkeletonReviewCard';
// Types
import { Provider } from '../src/types/provider';
import { Review } from '../src/types/review';
import { Service, Category } from '../src/types/service';
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';

// ========== MOCK DATA ==========

// Mock Services - Conforme DB GlamGo
const mockServices = [
  {
    id: 1,
    title: 'Coupe + Brushing Femme',
    slug: 'coupe-brushing-femme',
    description: 'Coupe de cheveux professionnelle avec brushing inclus.',
    price: 150,
    currency: 'MAD',
    duration_minutes: 60,
    images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400'],
    thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    category: { id: 1, name: 'Coiffure', color: '#E63946' },
    provider: { id: 1, name: 'Sarah Beauty', avatar: 'https://i.pravatar.cc/150?img=1' },
    rating: 4.8,
    reviews_count: 124,
    status: 'active' as const,
    is_featured: true,
    isNew: true,
    isFavorite: false,
  },
  {
    id: 2,
    title: 'Massage Relaxant 90 min',
    slug: 'massage-relaxant-90min',
    description: 'Massage complet du corps pour une relaxation profonde.',
    price: 300,
    currency: 'MAD',
    duration_minutes: 90,
    images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'],
    thumbnail: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    category: { id: 2, name: 'Bien-etre', color: '#2A9D8F' },
    provider: { id: 2, name: 'Zen Spa', avatar: 'https://i.pravatar.cc/150?img=5' },
    rating: 4.9,
    reviews_count: 89,
    status: 'active' as const,
    is_featured: false,
    isNew: false,
    isFavorite: true,
  },
  {
    id: 3,
    title: 'Menage Complet 3 Pieces',
    slug: 'menage-complet',
    description: 'Nettoyage approfondi de votre appartement.',
    price: 200,
    currency: 'MAD',
    duration_minutes: 180,
    images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400'],
    thumbnail: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    category: { id: 3, name: 'Menage', color: '#F4A261' },
    provider: { id: 3, name: 'CleanPro' },
    rating: 4.6,
    reviews_count: 203,
    status: 'active' as const,
    is_featured: true,
    isNew: false,
    isFavorite: false,
  },
];

// Mock Categories - Conforme DB GlamGo
const mockCategories = [
  { id: 1, name: 'Coiffure', slug: 'coiffure', icon: '💇', color: '#E63946', services_count: 24 },
  { id: 2, name: 'Bien-etre', slug: 'bien-etre', icon: '💆', color: '#2A9D8F', services_count: 18 },
  { id: 3, name: 'Menage', slug: 'menage', icon: '🧹', color: '#F4A261', services_count: 12 },
  { id: 4, name: 'Beaute', slug: 'beaute', icon: '💅', color: '#E76F51', services_count: 31 },
];

// Mock Bookings - 6 statuts différents (conforme DB GlamGo)
const mockBookings = [
  {
    id: 1,
    service: {
      id: 1,
      title: 'Coupe Femme Tendance',
      thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    },
    provider: {
      id: 1,
      name: 'Fatima Zahra',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
    booking_date: '2024-12-20',
    booking_time: '14:30:00',
    status: 'pending' as const,
    total: 150,
    currency: 'MAD',
    address: '123 Avenue Mohammed V, Guéliz, Marrakech',
    notes: 'En attente de confirmation du prestataire',
  },
  {
    id: 2,
    service: {
      id: 2,
      title: 'Massage Relaxant 60 min',
      thumbnail: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    },
    provider: {
      id: 2,
      name: 'Sara Ahmed',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    },
    booking_date: '2024-12-21',
    booking_time: '10:00:00',
    status: 'accepted' as const,
    total: 300,
    currency: 'MAD',
    address: '45 Rue Ibn Aicha, Hivernage, Marrakech',
  },
  {
    id: 3,
    service: {
      id: 3,
      title: 'Manucure + Pédicure',
      thumbnail: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
    },
    provider: {
      id: 3,
      name: 'Nadia Benali',
      avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100',
    },
    booking_date: '2024-12-18',
    booking_time: '15:00:00',
    status: 'on_way' as const,
    total: 180,
    currency: 'MAD',
    address: '78 Boulevard Zerktouni, Guéliz, Marrakech',
  },
  {
    id: 4,
    service: {
      id: 4,
      title: 'Coloration + Mèches',
      thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    },
    provider: {
      id: 4,
      name: 'Laila Amrani',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    },
    booking_date: '2024-12-18',
    booking_time: '11:00:00',
    status: 'in_progress' as const,
    total: 450,
    currency: 'MAD',
    address: '12 Rue Moulay Ali, Médina, Marrakech',
    notes: 'Coloration blonde cendrée',
  },
  {
    id: 5,
    service: {
      id: 5,
      title: 'Soin Visage Hydratant',
      thumbnail: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
    },
    provider: {
      id: 5,
      name: 'Kenza Idrissi',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100',
    },
    booking_date: '2024-12-15',
    booking_time: '16:30:00',
    status: 'completed' as const,
    total: 250,
    currency: 'MAD',
    address: '56 Avenue Hassan II, Guéliz, Marrakech',
  },
  {
    id: 6,
    service: {
      id: 6,
      title: 'Épilation Jambes Complètes',
      thumbnail: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=400',
    },
    provider: {
      id: 6,
      name: 'Houda Tazi',
    },
    booking_date: '2024-12-14',
    booking_time: '09:00:00',
    status: 'cancelled' as const,
    total: 120,
    currency: 'MAD',
    address: '34 Rue de la Liberté, Guéliz, Marrakech',
    notes: 'Annulé par le client',
  },
];

// Mock Providers - Conforme DB GlamGo
const mockProviders: Provider[] = [
  {
    id: 1,
    user_id: 101,
    name: 'Sarah Beauty Salon',
    slug: 'sarah-beauty-salon',
    email: 'contact@sarahbeauty.com',
    phone: '+212 6 12 34 56 78',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: 'Salon de coiffure professionnel avec 10 ans d\'expérience. Spécialiste des coupes tendances et colorations.',
    company_name: 'Sarah Beauty SARL',
    business_type: 'company',
    city: 'Marrakech',
    rating: 4.9,
    reviews_count: 156,
    services_count: 12,
    completed_bookings_count: 450,
    categories: ['Coiffure', 'Beauté', 'Maquillage'],
    category_ids: [1, 4, 7],
    is_verified: true,
    verified_at: '2023-06-15T10:00:00Z',
    is_active: true,
    is_available: true,
    joined_date: '2023-01-10T00:00:00Z',
    created_at: '2023-01-10T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 102,
    name: 'Zen Spa Marrakech',
    slug: 'zen-spa-marrakech',
    email: 'info@zenspa.ma',
    phone: '+212 5 24 12 34 56',
    avatar: 'https://i.pravatar.cc/150?img=5',
    cover_image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    bio: 'Centre de bien-être et spa. Massages relaxants, soins du corps, hammam traditionnel.',
    description: 'Votre oasis de tranquillité au cœur de Marrakech. Équipe certifiée, produits bio.',
    company_name: 'Zen Spa & Wellness',
    business_type: 'company',
    address: 'Avenue Mohammed VI',
    city: 'Marrakech',
    postal_code: '40000',
    rating: 4.8,
    reviews_count: 89,
    services_count: 8,
    completed_bookings_count: 320,
    categories: ['Bien-être', 'Spa', 'Massage'],
    category_ids: [2, 8, 9],
    is_verified: true,
    verified_at: '2023-08-20T10:00:00Z',
    is_active: true,
    is_available: true,
    joined_date: '2023-03-05T00:00:00Z',
    created_at: '2023-03-05T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    user_id: 103,
    name: 'CleanPro Services',
    slug: 'cleanpro-services',
    email: 'contact@cleanpro.ma',
    phone: '+212 6 98 76 54 32',
    bio: 'Service de ménage professionnel. Équipe formée et équipée. Produits écologiques.',
    business_type: 'individual',
    city: 'Marrakech',
    rating: 4.6,
    reviews_count: 203,
    services_count: 5,
    completed_bookings_count: 580,
    categories: ['Ménage', 'Nettoyage'],
    category_ids: [3, 10],
    is_verified: false,
    is_active: true,
    is_available: true,
    joined_date: '2023-07-12T00:00:00Z',
    created_at: '2023-07-12T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    user_id: 104,
    name: 'Mohamed Fitness Coach',
    slug: 'mohamed-fitness-coach',
    email: 'mohamed.coach@gmail.com',
    phone: '+212 6 11 22 33 44',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Coach sportif certifié. Programme personnalisé à domicile.',
    description: 'Certifié CrossFit Level 1, Nutrition sportive. 8 ans d\'expérience.',
    business_type: 'individual',
    city: 'Marrakech',
    rating: 5.0,
    reviews_count: 42,
    services_count: 6,
    completed_bookings_count: 150,
    categories: ['Fitness', 'Sport', 'Coaching'],
    category_ids: [5, 11, 12],
    is_verified: true,
    verified_at: '2024-01-10T10:00:00Z',
    is_active: true,
    is_available: false,
    joined_date: '2023-11-20T00:00:00Z',
    created_at: '2023-11-20T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
];

// Mock Reviews - Conforme DB GlamGo
const mockReviews: Review[] = [
  {
    id: 1,
    user_id: 201,
    user: {
      id: 201,
      name: 'Amina Benali',
      avatar: 'https://i.pravatar.cc/150?img=9',
    },
    service_id: 1,
    service: {
      id: 1,
      title: 'Coupe + Brushing Femme',
      thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    },
    order_id: 101,
    provider_id: 1,
    rating: 5,
    title: 'Excellente prestation !',
    comment: 'Excellente prestation ! Sarah est très professionnelle et à l\'écoute. Le salon est propre et l\'ambiance agréable. Je recommande vivement !',
    is_verified_purchase: true,
    helpful_count: 12,
    is_approved: true,
    is_flagged: false,
    created_at: '2024-12-15T10:30:00Z',
    updated_at: '2024-12-15T10:30:00Z',
  },
  {
    id: 2,
    user_id: 202,
    user: {
      id: 202,
      name: 'Karim M.',
      avatar: 'https://i.pravatar.cc/150?img=13',
    },
    service_id: 2,
    service: {
      id: 2,
      title: 'Massage Relaxant 60 min',
      thumbnail: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    },
    order_id: 102,
    provider_id: 2,
    rating: 4,
    title: 'Très bon massage',
    comment: 'Très bon massage relaxant. L\'ambiance zen est parfaite pour se détendre. Seul petit bémol : j\'aurais aimé que le massage dure un peu plus longtemps, mais sinon c\'était top !',
    is_verified_purchase: true,
    helpful_count: 8,
    is_approved: true,
    is_flagged: false,
    provider_response: {
      text: 'Merci Karim pour votre retour ! Nous proposons également des massages de 90 minutes si vous souhaitez une séance plus longue. Au plaisir de vous revoir !',
      responded_at: '2024-12-11T09:00:00Z',
    },
    created_at: '2024-12-10T14:00:00Z',
    updated_at: '2024-12-11T09:00:00Z',
  },
  {
    id: 3,
    user_id: 203,
    user: {
      id: 203,
      name: 'Fatima Z.',
    },
    service_id: 3,
    service: {
      id: 3,
      title: 'Ménage Complet 3 Pièces',
      thumbnail: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    },
    order_id: 103,
    provider_id: 3,
    rating: 5,
    comment: 'Service impeccable ! L\'équipe est arrivée à l\'heure, très professionnelle et efficace. Mon appartement n\'a jamais été aussi propre. Je vais certainement réserver à nouveau.',
    is_verified_purchase: false,
    helpful_count: 5,
    is_approved: true,
    is_flagged: false,
    created_at: '2024-12-08T16:00:00Z',
    updated_at: '2024-12-08T16:00:00Z',
  },
  {
    id: 4,
    user_id: 204,
    user: {
      id: 204,
      name: 'Youssef H.',
      avatar: 'https://i.pravatar.cc/150?img=15',
    },
    service_id: 1,
    service: {
      id: 1,
      title: 'Coiffure Homme',
      thumbnail: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
    },
    order_id: 104,
    provider_id: 4,
    rating: 3,
    title: 'Service correct',
    comment: 'Service correct mais rien d\'exceptionnel. Le coiffeur était sympathique mais j\'attendais un peu mieux pour ce prix.',
    is_verified_purchase: true,
    helpful_count: 2,
    is_approved: true,
    is_flagged: false,
    created_at: '2024-12-05T11:00:00Z',
    updated_at: '2024-12-05T11:00:00Z',
  },
];

export default function TestComponentsScreen() {
  const [textValue, setTextValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [errorValue, setErrorValue] = useState('test@error');
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test Composants UI</Text>
        <Link href="/">
          <Text style={styles.backText}>← Retour</Text>
        </Link>
      </View>

      {/* ==================== UI COMPONENTS ==================== */}

      {/* BUTTON SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button - Variants</Text>
        <Button variant="primary" onPress={() => Alert.alert('Primary!')}>
          Primary Button
        </Button>
        <View style={styles.spacer} />
        <Button variant="secondary" onPress={() => Alert.alert('Secondary!')}>
          Secondary Button
        </Button>
        <View style={styles.spacer} />
        <Button variant="outline" onPress={() => Alert.alert('Outline!')}>
          Outline Button
        </Button>
        <View style={styles.spacer} />
        <Button variant="ghost" onPress={() => Alert.alert('Ghost!')}>
          Ghost Button
        </Button>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button - States</Text>
        <Button disabled onPress={() => {}}>
          Disabled Button
        </Button>
        <View style={styles.spacer} />
        <Button loading onPress={() => {}}>
          Loading Button
        </Button>
      </View>

      {/* INPUT SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Input - Types</Text>
        <Input
          label="Text Input"
          placeholder="Entrez votre texte"
          value={textValue}
          onChangeText={setTextValue}
          helperText="Texte d'aide sous l'input"
        />
        <Input
          label="Email"
          type="email"
          placeholder="exemple@email.com"
          value={emailValue}
          onChangeText={setEmailValue}
        />
        <Input
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          value={passwordValue}
          onChangeText={setPasswordValue}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Input - States</Text>
        <Input
          label="Input avec erreur"
          value={errorValue}
          onChangeText={setErrorValue}
          error
          errorText="Format invalide"
        />
        <Input
          label="Input succès"
          value="valide@email.com"
          onChangeText={() => {}}
          success
        />
        <Input
          label="Input disabled"
          value="Non modifiable"
          onChangeText={() => {}}
          disabled
        />
      </View>

      {/* CARD SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card - Variants</Text>
        <Card variant="elevated" padding="md">
          <Text style={styles.cardText}>Card Elevated</Text>
        </Card>
        <View style={styles.spacer} />
        <Card variant="outlined" padding="md">
          <Text style={styles.cardText}>Card Outlined</Text>
        </Card>
        <View style={styles.spacer} />
        <Card variant="flat" padding="md">
          <Text style={styles.cardText}>Card Flat</Text>
        </Card>
      </View>

      {/* BADGE SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badge - Colors</Text>
        <View style={styles.badgeRow}>
          <Badge color="primary">Primary</Badge>
          <Badge color="secondary">Secondary</Badge>
          <Badge color="success">Success</Badge>
          <Badge color="warning">Warning</Badge>
          <Badge color="error">Error</Badge>
        </View>
        <View style={styles.spacer} />
        <Text style={styles.sectionSubtitle}>Badge - Variants</Text>
        <View style={styles.badgeRow}>
          <Badge color="primary" variant="filled">Filled</Badge>
          <Badge color="primary" variant="soft">Soft</Badge>
          <Badge color="primary" variant="outlined">Outlined</Badge>
        </View>
      </View>

      {/* SKELETON SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skeleton</Text>
        <Skeleton width="100%" height={20} borderRadius={4} />
        <View style={styles.spacer} />
        <Skeleton width="80%" height={16} borderRadius={4} />
        <View style={styles.spacer} />
        <Skeleton width={60} height={60} borderRadius={30} />
      </View>

      {/* MODAL SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modal</Text>
        <Button onPress={() => setModalVisible(true)}>
          Ouvrir Modal
        </Button>
        <Modal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title="Titre du Modal"
        >
          <Text style={styles.modalText}>
            Contenu du modal. Vous pouvez mettre n'importe quel contenu ici.
          </Text>
          <Button onPress={() => setModalVisible(false)}>
            Fermer
          </Button>
        </Modal>
      </View>

      {/* ==================== FEATURE COMPONENTS ==================== */}

      {/* CATEGORYCARD SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CategoryCard</Text>
        <View style={styles.categoryGrid}>
          {mockCategories.slice(0, 2).map((cat) => (
            <View key={cat.id} style={styles.categoryItem}>
              <CategoryCard
                name={cat.name}
                icon={cat.icon}
                color={cat.color}
                servicesCount={cat.services_count}
                onPress={() => Alert.alert('Catégorie', cat.name)}
              />
            </View>
          ))}
        </View>
      </View>

      {/* SERVICECARD SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ServiceCard</Text>
        {mockServices.map((service) => (
          <View key={service.id} style={styles.serviceCardWrapper}>
            <ServiceCard
              {...service}
              onPress={() => Alert.alert('Service', service.title || '')}
              onFavoritePress={(id, isFav) => Alert.alert('Favori', `${id}: ${isFav}`)}
            />
          </View>
        ))}
      </View>

      {/* BOOKINGCARD SECTION - 6 Statuts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BookingCard - 6 Statuts</Text>
        <Text style={styles.sectionSubtitle}>pending, accepted, on_way, in_progress, completed, cancelled</Text>
        {mockBookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCardWrapper}>
            <BookingCard
              {...booking}
              onViewDetails={(id) => Alert.alert('Détails', String(id))}
              onContact={(id) => Alert.alert('Contacter', `Prestataire ID: ${id}`)}
              onCancel={(id) => Alert.alert('Annuler', `Réservation ID: ${id}`)}
              onTrackProvider={(id) => Alert.alert('Suivre', `Tracking réservation ID: ${id}`)}
            />
          </View>
        ))}
      </View>

      {/* PROVIDERCARD SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ProviderCard</Text>
        {mockProviders.map((provider, index) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            isNearest={index === 0}
            onSelect={(p) => Alert.alert('Sélectionné', p.name)}
          />
        ))}
      </View>

      {/* REVIEWCARD SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ReviewCard - Default</Text>
        {mockReviews.slice(0, 2).map((review) => (
          <ReviewCard
            key={review.id}
            {...review}
            onHelpful={(id) => Alert.alert('Utile', `Review ${id} marqué comme utile`)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ReviewCard - Avec Service</Text>
        <ReviewCard
          {...mockReviews[2]}
          showService
          onHelpful={(id) => Alert.alert('Utile', String(id))}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ReviewCard - Note Moyenne</Text>
        <ReviewCard
          {...mockReviews[3]}
          onHelpful={(id) => Alert.alert('Utile', String(id))}
        />
      </View>

      {/* SKELETON CARDS SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skeleton Cards</Text>
        <Text style={styles.sectionSubtitle}>SkeletonCategoryCard</Text>
        <SkeletonCategoryCard />
        <View style={styles.spacer} />
        <Text style={styles.sectionSubtitle}>SkeletonServiceCard</Text>
        <SkeletonServiceCard />
        <View style={styles.spacer} />
        <Text style={styles.sectionSubtitle}>SkeletonBookingCard</Text>
        <SkeletonBookingCard />
        <View style={styles.spacer} />
        <Text style={styles.sectionSubtitle}>SkeletonProviderCard</Text>
        <SkeletonProviderCard />
        <View style={styles.spacer} />
        <Text style={styles.sectionSubtitle}>SkeletonReviewCard</Text>
        <SkeletonReviewCard />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: spacing.xl,
    paddingTop: 60,
    backgroundColor: colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  spacer: {
    height: spacing.md,
  },
  bottomSpacer: {
    height: 40,
  },
  // Card
  cardText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  // Badge
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // Modal
  modalText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  // Category
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryItem: {
    flex: 1,
    minWidth: 150,
  },
  // Service
  serviceCardWrapper: {
    marginBottom: spacing.md,
  },
  // Booking
  bookingCardWrapper: {
    marginBottom: spacing.md,
  },
});
