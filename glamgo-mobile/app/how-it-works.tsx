import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../src/lib/constants/theme';

type TabType = 'client' | 'provider';

const CLIENT_STEPS = [
  {
    number: '1',
    icon: '📱',
    title: 'Inscription et Profil',
    desc: 'Creez votre compte en quelques clics',
    details: [
      'Inscription rapide par email',
      'Verification de votre numero de telephone',
      'Ajout de vos adresses favorites (domicile, bureau...)',
      'Enregistrement de votre methode de paiement',
    ],
  },
  {
    number: '2',
    icon: '🔍',
    title: 'Recherche de Services',
    desc: 'Parcourez notre catalogue complet',
    details: [
      'Plus de 50 services disponibles (menage, coiffure, massage...)',
      'Filtrage par categorie et prix',
      'Visualisation des prestataires sur la carte',
      'Consultation des avis et notes',
    ],
  },
  {
    number: '3',
    icon: '📅',
    title: 'Reservation Flexible',
    desc: 'Choisissez votre creneau',
    details: [
      'Calendrier avec disponibilites en temps reel',
      'Choix de formules : Standard, Premium ou Nuit',
      'Selection de l adresse d intervention',
      'Ajout de notes speciales pour le prestataire',
      'Supplement nuit automatique (22h-6h) : +30 MAD',
    ],
  },
  {
    number: '4',
    icon: '💳',
    title: 'Paiement Securise',
    desc: 'Plusieurs options de paiement',
    details: [
      'Paiement par carte bancaire (debite a la fin)',
      'Paiement en especes au prestataire',
      'Prix affiche = prix final (pas de frais caches)',
      'Frais de deplacement calcules automatiquement',
      'Commission GlamGo : 20% (incluse dans le prix)',
    ],
  },
  {
    number: '5',
    icon: '📍',
    title: 'Suivi en Temps Reel',
    desc: 'Suivez l arrivee de votre prestataire',
    details: [
      'Notification quand le prestataire accepte',
      'Suivi GPS en temps reel quand il est en route',
      'Chat integre pour communiquer directement',
      'Confirmation d arrivee a votre domicile',
      'Numero de telephone du prestataire accessible',
    ],
  },
  {
    number: '6',
    icon: '⭐',
    title: 'Evaluation et Pourboire',
    desc: 'Notez votre experience',
    details: [
      'Questionnaire de satisfaction en 3 etapes',
      'Note de qualite (1 a 5 etoiles)',
      'Evaluation ponctualite et respect du prix',
      'Possibilite de laisser un pourboire (carte)',
      'Commentaires et photos optionnels',
    ],
  },
];

const PROVIDER_STEPS = [
  {
    number: '1',
    icon: '📝',
    title: 'Inscription Prestataire',
    desc: 'Creez votre compte professionnel',
    details: [
      'Formulaire d inscription dedie aux professionnels',
      'Verification de votre identite (CIN)',
      'Upload de vos certifications professionnelles',
      'Definition de votre zone d intervention (rayon en km)',
      'Configuration de vos coordonnees GPS',
    ],
  },
  {
    number: '2',
    icon: '🛠️',
    title: 'Configuration des Services',
    desc: 'Selectionnez vos services',
    details: [
      'Choix parmi plus de 50 services disponibles',
      'Personnalisation de votre tarif de base',
      'Definition de votre rayon d intervention',
      'Ajout de votre bio et experience',
      'Upload de photos de vos realisations',
    ],
  },
  {
    number: '3',
    icon: '🔔',
    title: 'Reception des Commandes',
    desc: 'Notifications en temps reel',
    details: [
      'Notifications push en temps reel',
      'Badge de notification sur le tableau de bord',
      'Details complets de chaque demande',
      'Adresse et distance du client affichees',
      'Date, heure et formule demandee visibles',
    ],
  },
  {
    number: '4',
    icon: '✅',
    title: 'Acceptation et Gestion',
    desc: 'Gerez votre planning',
    details: [
      'Acceptation en un clic depuis le dashboard',
      'Tableau de bord avec toutes vos commandes',
      'Statuts : En attente, Acceptee, En route, En cours, Terminee',
      'Possibilite d annulation avec frais selon delai',
      'Chat integre avec le client',
    ],
  },
  {
    number: '5',
    icon: '🚗',
    title: 'Navigation vers le Client',
    desc: 'Suivi GPS integre',
    details: [
      'Bouton "En route" pour signaler votre depart',
      'Votre position partagee en temps reel avec le client',
      'Acces a l adresse et au numero du client',
      'Navigation GPS integree',
      'Le client confirme votre arrivee',
    ],
  },
  {
    number: '6',
    icon: '💼',
    title: 'Realisation du Service',
    desc: 'Effectuez la prestation',
    details: [
      'Bouton "Commencer" pour demarrer le service',
      'Chronometre de duree de prestation',
      'Communication continue avec le client si besoin',
      'Bouton "Terminer" avec confirmation photo optionnelle',
      'Le client evalue ensuite la prestation',
    ],
  },
  {
    number: '7',
    icon: '💰',
    title: 'Paiement et Revenus',
    desc: 'Paiement automatique',
    details: [
      'Paiement carte : credite automatiquement (moins 20% commission)',
      'Paiement especes : vous gardez 80%, 20% preleve sur votre compte',
      'Pourboires 100% pour vous (pas de commission)',
      'Historique detaille de vos gains',
      'Tableau de bord financier complet',
    ],
  },
];

const CLIENT_FEATURES = [
  {
    icon: '🛡️',
    title: 'Prestataires Verifies',
    desc: 'Tous nos prestataires sont controles et certifies',
  },
  {
    icon: '🔄',
    title: 'Annulation Flexible',
    desc: 'Annulez gratuitement jusqu a 2h avant le RDV',
  },
  {
    icon: '💬',
    title: 'Support 24/7',
    desc: 'Notre equipe disponible via chat ou telephone',
  },
  {
    icon: '🔔',
    title: 'Notifications Intelligentes',
    desc: 'Informe a chaque etape : acceptation, depart, arrivee',
  },
];

const PROVIDER_FEATURES = [
  {
    icon: '📊',
    title: 'Tableau de Bord Complet',
    desc: 'Gerez vos commandes, statistiques et revenus en temps reel',
  },
  {
    icon: '⭐',
    title: 'Systeme de Notation',
    desc: 'Une bonne note augmente votre visibilite',
  },
  {
    icon: '🗺️',
    title: 'Zone d Intervention',
    desc: 'Definissez votre rayon d action',
  },
  {
    icon: '🔄',
    title: 'Gestion des Annulations',
    desc: '0 MAD (>2h), 20 MAD (1-2h), 50 MAD (<1h)',
  },
];

const PROVIDER_REVENUES = [
  {
    percent: '20%',
    title: 'Commission GlamGo',
    desc: 'Prelevee sur chaque prestation',
  },
  {
    percent: '80%',
    title: 'Vos Revenus',
    desc: 'Du montant total de la prestation',
  },
  {
    percent: '100%',
    title: 'Pourboires',
    desc: 'Integralement pour vous',
  },
];

const CANCELLATION_POLICY = [
  { delay: 'Plus de 2h avant', fee: '0 MAD' },
  { delay: 'Entre 1h et 2h', fee: '20 MAD' },
  { delay: 'Moins de 1h', fee: '50 MAD' },
  { delay: 'No-show', fee: '100 MAD' },
];

const PRICING = [
  {
    formula: 'Standard',
    desc: 'Service de base avec produits standards',
    modifier: 'Prix de base',
  },
  {
    formula: 'Premium',
    desc: 'Service premium avec produits haut de gamme',
    modifier: '+50 MAD',
  },
  {
    formula: 'Nuit',
    desc: 'Service entre 22h et 6h du matin',
    modifier: '+30 MAD',
  },
];

export default function HowItWorksScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('client');

  const steps = activeTab === 'client' ? CLIENT_STEPS : PROVIDER_STEPS;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comment ca marche</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'client' && styles.tabActive]}
          onPress={() => setActiveTab('client')}
        >
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={[styles.tabText, activeTab === 'client' && styles.tabTextActive]}>
            Je suis client
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'provider' && styles.tabActive]}
          onPress={() => setActiveTab('provider')}
        >
          <Text style={styles.tabIcon}>💼</Text>
          <Text style={[styles.tabText, activeTab === 'provider' && styles.tabTextActive]}>
            Je suis prestataire
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'client' ? 'Comment reserver un service ?' : 'Comment devenir prestataire ?'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {activeTab === 'client'
            ? 'Guide complet pour profiter de tous les services GlamGo a domicile'
            : 'Rejoignez notre reseau de prestataires professionnels'}
        </Text>

        {steps.map((step, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <View style={styles.stepTitleContainer}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
            <View style={styles.stepDetails}>
              {step.details.map((detail, i) => (
                <View key={i} style={styles.detailRow}>
                  <Text style={styles.detailBullet}>•</Text>
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'client' ? 'Vos Avantages Client' : 'Vos Outils Prestataire'}
          </Text>
          <View style={styles.featuresGrid}>
            {(activeTab === 'client' ? CLIENT_FEATURES : PROVIDER_FEATURES).map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Section - Client only */}
        {activeTab === 'client' && (
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Tarification Transparente</Text>
            <Text style={styles.sectionSubtitle}>Comprenez comment sont calcules les prix</Text>
            {PRICING.map((item, index) => (
              <View key={index} style={styles.pricingCard}>
                <View style={styles.pricingInfo}>
                  <Text style={styles.pricingFormula}>{item.formula}</Text>
                  <Text style={styles.pricingDesc}>{item.desc}</Text>
                </View>
                <Text style={styles.pricingModifier}>{item.modifier}</Text>
              </View>
            ))}
            <View style={styles.pricingNote}>
              <Text style={styles.pricingNoteTitle}>Calcul du prix final :</Text>
              <Text style={styles.pricingNoteText}>
                Prix de base + Formule + Frais de deplacement (si {'>'} 5km) + Supplement nuit (si applicable)
              </Text>
            </View>
          </View>
        )}

        {/* Revenues Section - Provider only */}
        {activeTab === 'provider' && (
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Vos Revenus</Text>
            <Text style={styles.sectionSubtitle}>Tarification transparente et equitable</Text>
            <View style={styles.revenuesGrid}>
              {PROVIDER_REVENUES.map((item, index) => (
                <View key={index} style={styles.revenueCard}>
                  <Text style={styles.revenuePercent}>{item.percent}</Text>
                  <Text style={styles.revenueTitle}>{item.title}</Text>
                  <Text style={styles.revenueDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Cancellation Policy - Provider only */}
        {activeTab === 'provider' && (
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Politique d Annulation</Text>
            <Text style={styles.sectionSubtitle}>Frais si vous annulez une commande acceptee</Text>
            {CANCELLATION_POLICY.map((item, index) => (
              <View key={index} style={styles.cancellationRow}>
                <Text style={styles.cancellationDelay}>{item.delay}</Text>
                <Text style={[
                  styles.cancellationFee,
                  item.fee === '0 MAD' && styles.cancellationFeeGreen
                ]}>{item.fee}</Text>
              </View>
            ))}
            <View style={styles.pricingNote}>
              <Text style={styles.pricingNoteText}>
                En cas d annulation, la commande est automatiquement re-proposee aux autres prestataires disponibles.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Pret a commencer ?</Text>
          <Link href={activeTab === 'client' ? '/auth/signup-client' : '/auth/signup-provider'} asChild>
            <TouchableOpacity style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>
                {activeTab === 'client' ? 'Creer mon compte client' : 'Devenir prestataire'}
              </Text>
            </TouchableOpacity>
          </Link>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.backLink}>
              <Text style={styles.backLinkText}>Retour a l accueil</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: colors.gray[900],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 36,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
  },
  tabTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
  },
  stepCard: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  stepIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  stepTitleContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  stepDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  stepDetails: {
    marginLeft: 36,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  detailBullet: {
    fontSize: 14,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    flex: 1,
  },
  featuresSection: {
    marginTop: spacing.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  featureTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    textAlign: 'center',
  },
  pricingSection: {
    marginTop: spacing.lg,
  },
  pricingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pricingInfo: {
    flex: 1,
  },
  pricingFormula: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  pricingDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  pricingModifier: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary,
  },
  pricingNote: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  pricingNoteTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  pricingNoteText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  revenuesGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  revenuePercent: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  revenueTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 2,
  },
  revenueDesc: {
    fontSize: 10,
    color: colors.gray[500],
    textAlign: 'center',
  },
  cancellationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  cancellationDelay: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  cancellationFee: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.error,
  },
  cancellationFeeGreen: {
    color: colors.success,
  },
  ctaSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  ctaTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  ctaButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  backLink: {
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    color: colors.gray[500],
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },
});
