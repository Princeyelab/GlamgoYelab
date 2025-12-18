import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Link } from 'expo-router';
import Button from '../src/components/ui/Button';
import Card from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Skeleton from '../src/components/ui/Skeleton';
import ProviderCard from '../src/components/features/ProviderCard';
import SkeletonProviderCard from '../src/components/features/SkeletonProviderCard';
import { Provider } from '../src/types/provider';
import { colors, spacing, typography } from '../src/lib/constants/theme';

// Mock providers data pour tester ProviderCard (contexte Marrakech)
const mockProviders: Provider[] = [
  {
    id: 'provider-1',
    name: 'Fatima Zahra El Alaoui',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    bio: 'Coiffeuse professionnelle avec 10 ans experience. Specialisee dans les coupes modernes.',
    rating: 4.8,
    total_reviews: 156,
    isVerified: true,
    is_available_now: true,
    categories: ['Coiffure', 'Soins Capillaires', 'Coloration'],
    distance: 1.2,
    within_intervention_radius: true,
    base_price: 150,
    duration_minutes: 45,
  },
  {
    id: 'provider-2',
    name: 'Amina Benali',
    bio: 'Estheticienne diplomee, passionnee par les soins du visage.',
    rating: 4.5,
    total_reviews: 89,
    isVerified: true,
    is_available_now: false,
    next_availability: 'Demain 10h',
    categories: ['Maquillage', 'Soins Visage', 'Epilation', 'Manucure'],
    distance: 3.5,
    within_intervention_radius: false,
    extra_distance_km: 1.5,
    base_price: 200,
    distance_fee: 30,
    price_per_extra_km: 20,
    duration_minutes: 60,
  },
  {
    id: 'provider-3',
    name: 'Sara Ait Ahmed',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    bio: 'Masseuse certifiee, specialiste du massage relaxant et du hammam traditionnel.',
    rating: 4.9,
    total_reviews: 234,
    isVerified: false,
    is_available_now: true,
    categories: ['Massage', 'Hammam'],
    distance: 0.8,
    within_intervention_radius: true,
    base_price: 300,
    duration_minutes: 90,
  },
  {
    id: 'provider-4',
    name: 'Khadija El Mansouri',
    avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200',
    rating: 4.2,
    total_reviews: 45,
    isVerified: true,
    is_available_now: true,
    categories: ['Onglerie'],
    distance: 5.2,
    within_intervention_radius: false,
    extra_distance_km: 3.2,
    base_price: 100,
    distance_fee: 64,
    price_per_extra_km: 20,
    duration_minutes: 30,
  },
];

export default function TestProviderCardScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test ProviderCard</Text>
        <Link href="/">
          <Text style={styles.backText}>Retour</Text>
        </Link>
      </View>

      {/* PROVIDERCARD SECTION - Default with distance/price */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ProviderCard - Default</Text>
        <View style={styles.providerCardList}>
          {mockProviders.slice(0, 2).map((provider, index) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isNearest={index === 0}
              onSelect={(p) => Alert.alert('Sélectionné', `${p.name} sélectionné`)}
            />
          ))}
        </View>
      </View>

      {/* PROVIDERCARD SECTION - Compact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ProviderCard - Compact</Text>
        <View style={styles.providerCardList}>
          {mockProviders.slice(2, 4).map((provider) => (
            <ProviderCard
              key={'compact-' + provider.id}
              provider={provider}
              compact
              onSelect={(p) => Alert.alert('Sélectionné', `${p.name} sélectionné`)}
            />
          ))}
        </View>
      </View>

      {/* PROVIDERCARD SECTION - Selected state */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ProviderCard - Selected</Text>
        <View style={styles.providerCardList}>
          <ProviderCard
            provider={mockProviders[0]}
            selected
            onSelect={(p) => Alert.alert('Sélectionné', `${p.name}`)}
          />
        </View>
      </View>

      {/* SKELETONPROVIDERCARD SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SkeletonProviderCard</Text>
        <View style={styles.providerCardList}>
          <SkeletonProviderCard />
          <SkeletonProviderCard compact />
        </View>
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
  bottomSpacer: {
    height: 40,
  },
  providerCardList: {
    gap: spacing.base,
  },
});
