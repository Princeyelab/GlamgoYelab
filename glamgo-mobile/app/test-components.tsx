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
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';

// ========== MOCK DATA ==========

// Mock Services
const mockServices = [
  {
    id: 'service-1',
    name: 'Coupe Femme Tendance',
    description: 'Coupe moderne avec brushing inclus. Consultation personnalisée.',
    category: { id: 'cat-1', name: 'Coiffure' },
    price: 150,
    currency: 'DH',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    rating: 4.8,
    reviewsCount: 156,
    provider: {
      id: 'prov-1',
      name: 'Fatima Zahra',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
    isNew: true,
  },
  {
    id: 'service-2',
    name: 'Massage Relaxant',
    description: 'Massage complet du corps pour une détente totale.',
    category: { id: 'cat-2', name: 'Massage' },
    price: 300,
    currency: 'DH',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    rating: 4.9,
    reviewsCount: 234,
    provider: {
      id: 'prov-2',
      name: 'Sara Ahmed',
    },
    isNew: false,
  },
];

// Mock Categories
const mockCategories = [
  { id: 'cat-1', name: 'Coiffure', icon: '💇‍♀️', color: '#E91E63', servicesCount: 45 },
  { id: 'cat-2', name: 'Massage', icon: '💆‍♀️', color: '#9C27B0', servicesCount: 32 },
  { id: 'cat-3', name: 'Maquillage', icon: '💄', color: '#F44336', servicesCount: 28 },
  { id: 'cat-4', name: 'Onglerie', icon: '💅', color: '#E91E63', servicesCount: 22 },
];

// Mock Bookings
const mockBookings = [
  {
    id: 'booking-1',
    service: {
      id: 'service-1',
      name: 'Coupe Femme Tendance',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    },
    provider: {
      id: 'prov-1',
      name: 'Fatima Zahra',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
    date: '2024-12-20',
    time: '14:30',
    status: 'confirmed' as const,
    price: 150,
    currency: 'DH',
    address: '123 Avenue Mohammed V, Guéliz, Marrakech',
  },
  {
    id: 'booking-2',
    service: {
      id: 'service-2',
      name: 'Massage Relaxant',
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    },
    provider: {
      id: 'prov-2',
      name: 'Sara Ahmed',
    },
    date: '2024-12-22',
    time: '10:00',
    status: 'pending' as const,
    price: 300,
    currency: 'DH',
    address: '45 Rue Ibn Aicha, Hivernage, Marrakech',
    notes: 'Allergie aux huiles essentielles',
  },
];

// Mock Providers
const mockProviders: Provider[] = [
  {
    id: 'provider-1',
    name: 'Fatima Zahra El Alaoui',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    bio: 'Coiffeuse professionnelle avec 10 ans experience.',
    rating: 4.8,
    total_reviews: 156,
    isVerified: true,
    is_available_now: true,
    categories: ['Coiffure', 'Soins Capillaires'],
    distance: 1.2,
    within_intervention_radius: true,
    base_price: 150,
    duration_minutes: 45,
  },
  {
    id: 'provider-2',
    name: 'Amina Benali',
    bio: 'Estheticienne diplomee.',
    rating: 4.5,
    total_reviews: 89,
    isVerified: true,
    is_available_now: false,
    next_availability: 'Demain 10h',
    categories: ['Maquillage', 'Soins Visage'],
    distance: 3.5,
    within_intervention_radius: false,
    extra_distance_km: 1.5,
    base_price: 200,
    distance_fee: 30,
    duration_minutes: 60,
  },
];

// Mock Reviews
const mockReviews: Review[] = [
  {
    id: 'r1',
    user: {
      id: 'u1',
      name: 'Amina Benali',
      avatar: 'https://i.pravatar.cc/150?img=9',
    },
    service: {
      id: 's1',
      name: 'Coupe + Brushing Femme',
    },
    rating: 5,
    comment: "Excellente prestation ! Sarah est très professionnelle et à l'écoute. Le salon est propre et l'ambiance agréable. Je recommande vivement !",
    date: '2024-12-15T10:30:00Z',
    isVerified: true,
    helpfulCount: 12,
  },
  {
    id: 'r2',
    user: {
      id: 'u2',
      name: 'Karim M.',
      avatar: 'https://i.pravatar.cc/150?img=13',
    },
    rating: 4,
    comment: "Très bon massage relaxant. L'ambiance zen est parfaite pour se détendre. Seul petit bémol : j'aurais aimé que le massage dure un peu plus longtemps, mais sinon c'était top !",
    date: '2024-12-10T14:00:00Z',
    isVerified: true,
    helpfulCount: 8,
    providerResponse: {
      text: 'Merci Karim pour votre retour ! Nous proposons également des massages de 90 minutes si vous souhaitez une séance plus longue. Au plaisir de vous revoir !',
      date: '2024-12-11T09:00:00Z',
    },
  },
  {
    id: 'r3',
    user: {
      id: 'u3',
      name: 'Fatima Z.',
    },
    service: {
      id: 's3',
      name: 'Ménage Complet 3 Pièces',
    },
    rating: 5,
    comment: "Service impeccable ! L'équipe est arrivée à l'heure, très professionnelle et efficace. Mon appartement n'a jamais été aussi propre. Je vais certainement réserver à nouveau.",
    date: '2024-12-08T16:00:00Z',
    isVerified: false,
    helpfulCount: 5,
  },
  {
    id: 'r4',
    user: {
      id: 'u4',
      name: 'Youssef H.',
      avatar: 'https://i.pravatar.cc/150?img=15',
    },
    rating: 3,
    comment: "Service correct mais rien d'exceptionnel. Le coiffeur était sympathique mais j'attendais un peu mieux pour ce prix.",
    date: '2024-12-05T11:00:00Z',
    isVerified: true,
    helpfulCount: 2,
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
                servicesCount={cat.servicesCount}
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
              onPress={() => Alert.alert('Service', service.name)}
              onFavoritePress={(id, isFav) => Alert.alert('Favori', `${id}: ${isFav}`)}
            />
          </View>
        ))}
      </View>

      {/* BOOKINGCARD SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BookingCard</Text>
        {mockBookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCardWrapper}>
            <BookingCard
              {...booking}
              onViewDetails={(id) => Alert.alert('Détails', id)}
              onContact={(id) => Alert.alert('Contact', id)}
              onCancel={(id) => Alert.alert('Annuler', id)}
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
          onHelpful={(id) => Alert.alert('Utile', id)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ReviewCard - Note Moyenne</Text>
        <ReviewCard
          {...mockReviews[3]}
          onHelpful={(id) => Alert.alert('Utile', id)}
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
