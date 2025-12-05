'use client';

import Link from 'next/link';
import styles from '../page.module.scss';
import Button from '@/components/Button';

export default function HowItWorksClientPage() {
  const steps = [
    {
      number: '1',
      icon: '📱',
      title: 'Inscription et Profil',
      description: 'Créez votre compte en quelques clics et complétez votre profil pour une expérience personnalisée.',
      details: [
        'Inscription rapide par email',
        'Vérification de votre numéro de téléphone',
        'Ajout de vos adresses favorites (domicile, bureau...)',
        'Enregistrement de votre méthode de paiement'
      ]
    },
    {
      number: '2',
      icon: '🔍',
      title: 'Recherche de Services',
      description: 'Parcourez notre catalogue complet de services à domicile disponibles à Marrakech et ses environs.',
      details: [
        'Plus de 50 services disponibles (ménage, coiffure, massage...)',
        'Filtrage par catégorie et prix',
        'Visualisation des prestataires à proximité sur la carte',
        'Consultation des avis et notes des prestataires'
      ]
    },
    {
      number: '3',
      icon: '📅',
      title: 'Réservation Flexible',
      description: 'Choisissez votre créneau et personnalisez votre prestation selon vos besoins.',
      details: [
        'Calendrier interactif avec disponibilités en temps réel',
        'Choix de formules : Standard, Premium ou Nuit',
        'Sélection de l\'adresse d\'intervention',
        'Ajout de notes spéciales pour le prestataire',
        'Supplément nuit automatique (22h-6h) : +30 MAD'
      ]
    },
    {
      number: '4',
      icon: '💳',
      title: 'Paiement Sécurisé',
      description: 'Plusieurs options de paiement pour votre confort, avec tarification transparente.',
      details: [
        'Paiement par carte bancaire (débité à la fin du service)',
        'Paiement en espèces directement au prestataire',
        'Prix affiché = prix final (pas de frais cachés)',
        'Frais de déplacement calculés automatiquement',
        'Commission GlamGo : 20% (incluse dans le prix)'
      ]
    },
    {
      number: '5',
      icon: '📍',
      title: 'Suivi en Temps Réel',
      description: 'Suivez l\'arrivée de votre prestataire et communiquez facilement avec lui.',
      details: [
        'Notification quand le prestataire accepte la commande',
        'Suivi GPS en temps réel quand il est en route',
        'Chat intégré pour communiquer directement',
        'Confirmation d\'arrivée à votre domicile',
        'Numéro de téléphone du prestataire accessible'
      ]
    },
    {
      number: '6',
      icon: '⭐',
      title: 'Évaluation et Pourboire',
      description: 'Notez votre expérience et récompensez un excellent service.',
      details: [
        'Questionnaire de satisfaction en 3 étapes',
        'Note de qualité (1 à 5 étoiles)',
        'Évaluation ponctualité et respect du prix',
        'Possibilité de laisser un pourboire (carte uniquement)',
        'Commentaires et photos optionnels'
      ]
    }
  ];

  const features = [
    {
      icon: '🛡️',
      title: 'Prestataires Vérifiés',
      description: 'Tous nos prestataires sont contrôlés et disposent des certifications nécessaires.'
    },
    {
      icon: '🔄',
      title: 'Annulation Flexible',
      description: 'Annulez gratuitement jusqu\'à 2h avant le rendez-vous. Si le prestataire annule, un remplaçant est automatiquement recherché.'
    },
    {
      icon: '💬',
      title: 'Support 24/7',
      description: 'Notre équipe est disponible pour vous aider à tout moment via le chat ou par téléphone.'
    },
    {
      icon: '🔔',
      title: 'Notifications Intelligentes',
      description: 'Restez informé à chaque étape : acceptation, départ, arrivée, fin de prestation.'
    }
  ];

  const pricing = [
    {
      formula: 'Standard',
      description: 'Service de base avec produits standards',
      modifier: 'Prix de base'
    },
    {
      formula: 'Premium',
      description: 'Service premium avec produits haut de gamme',
      modifier: '+50 MAD'
    },
    {
      formula: 'Nuit',
      description: 'Service entre 22h et 6h du matin',
      modifier: '+30 MAD'
    }
  ];

  return (
    <div className={styles.howItWorksPage}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroTabs}>
            <Link href="/how-it-works/client" className={`${styles.heroTab} ${styles.active}`}>
              👤 Client
            </Link>
            <Link href="/how-it-works/provider" className={styles.heroTab}>
              💼 Prestataire
            </Link>
          </div>
          <h1 className={styles.title}>Comment réserver un service ?</h1>
          <p className={styles.subtitle}>
            Guide complet pour profiter de tous les services GlamGo à domicile
          </p>
        </div>
      </section>

      <div className="container">
        <section className={styles.stepsSection}>
          <div className={styles.steps}>
            {steps.map((step, index) => (
              <div key={index} className={styles.stepCard}>
                <div className={styles.stepNumber}>{step.number}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepDescription}>{step.description}</p>
                <ul className={styles.stepDetails}>
                  {step.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.pricingSection}>
          <h2 className={styles.sectionTitle}>Tarification Transparente</h2>
          <p className={styles.sectionSubtitle}>Comprenez comment sont calculés les prix</p>
          <div className={styles.pricingGrid}>
            {pricing.map((item, index) => (
              <div key={index} className={styles.pricingCard}>
                <h3>{item.formula}</h3>
                <p>{item.description}</p>
                <span className={styles.pricingModifier}>{item.modifier}</span>
              </div>
            ))}
          </div>
          <div className={styles.pricingNote}>
            <strong>Calcul du prix final :</strong>
            <p>Prix de base + Formule + Frais de déplacement (si &gt; 5km) + Supplément nuit (si applicable)</p>
          </div>
        </section>

        <section className={styles.benefitsSection}>
          <h2 className={styles.sectionTitle}>Vos Avantages Client</h2>
          <div className={styles.benefitsGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>{feature.icon}</div>
                <h3 className={styles.benefitTitle}>{feature.title}</h3>
                <p className={styles.benefitDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.cta}>
            <h2>Prêt à réserver votre premier service ?</h2>
            <p>Rejoignez des milliers de clients satisfaits à Marrakech</p>
            <div className={styles.ctaButtons}>
              <Link href="/services">
                <Button variant="primary" size="large">
                  Découvrir nos services
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="large">
                  Créer un compte
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
