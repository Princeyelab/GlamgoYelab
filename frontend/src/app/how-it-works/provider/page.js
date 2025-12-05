'use client';

import Link from 'next/link';
import styles from '../page.module.scss';
import Button from '@/components/Button';

export default function HowItWorksProviderPage() {
  const steps = [
    {
      number: '1',
      icon: '📝',
      title: 'Inscription Prestataire',
      description: 'Créez votre compte professionnel et complétez votre profil pour être visible des clients.',
      details: [
        'Formulaire d\'inscription dédié aux professionnels',
        'Vérification de votre identité (CIN)',
        'Upload de vos certifications professionnelles',
        'Définition de votre zone d\'intervention (rayon en km)',
        'Configuration de vos coordonnées GPS'
      ]
    },
    {
      number: '2',
      icon: '🛠️',
      title: 'Configuration des Services',
      description: 'Sélectionnez les services que vous proposez parmi notre catalogue.',
      details: [
        'Choix parmi plus de 50 services disponibles',
        'Personnalisation de votre tarif de base',
        'Définition de votre rayon d\'intervention',
        'Ajout de votre bio et expérience',
        'Upload de photos de vos réalisations'
      ]
    },
    {
      number: '3',
      icon: '🔔',
      title: 'Réception des Commandes',
      description: 'Recevez des notifications pour chaque nouvelle commande dans votre zone.',
      details: [
        'Notifications push en temps réel',
        'Badge de notification sur le tableau de bord',
        'Détails complets de chaque demande',
        'Adresse et distance du client affichées',
        'Date, heure et formule demandée visibles'
      ]
    },
    {
      number: '4',
      icon: '✅',
      title: 'Acceptation et Gestion',
      description: 'Acceptez les commandes qui vous conviennent et gérez votre planning.',
      details: [
        'Acceptation en un clic depuis le dashboard',
        'Tableau de bord avec toutes vos commandes',
        'Statuts : En attente, Acceptée, En route, En cours, Terminée',
        'Possibilité d\'annulation avec frais selon délai',
        'Chat intégré avec le client'
      ]
    },
    {
      number: '5',
      icon: '🚗',
      title: 'Navigation vers le Client',
      description: 'Utilisez le suivi GPS intégré pour vous rendre chez le client.',
      details: [
        'Bouton "En route" pour signaler votre départ',
        'Votre position partagée en temps réel avec le client',
        'Accès à l\'adresse et au numéro du client',
        'Navigation GPS intégrée',
        'Le client confirme votre arrivée'
      ]
    },
    {
      number: '6',
      icon: '💼',
      title: 'Réalisation du Service',
      description: 'Effectuez la prestation et signalez sa fin via l\'application.',
      details: [
        'Bouton "Commencer" pour démarrer le service',
        'Chronomètre de durée de prestation',
        'Communication continue avec le client si besoin',
        'Bouton "Terminer" avec confirmation photo optionnelle',
        'Le client évalue ensuite la prestation'
      ]
    },
    {
      number: '7',
      icon: '💰',
      title: 'Paiement et Revenus',
      description: 'Recevez votre paiement automatiquement après validation du client.',
      details: [
        'Paiement carte : crédité automatiquement (moins 20% commission)',
        'Paiement espèces : vous gardez 80%, 20% prélevé sur votre compte',
        'Pourboires 100% pour vous (pas de commission)',
        'Historique détaillé de vos gains',
        'Tableau de bord financier complet'
      ]
    }
  ];

  const features = [
    {
      icon: '📊',
      title: 'Tableau de Bord Complet',
      description: 'Gérez toutes vos commandes, consultez vos statistiques et suivez vos revenus en temps réel.'
    },
    {
      icon: '⭐',
      title: 'Système de Notation',
      description: 'Les clients vous notent après chaque prestation. Une bonne note augmente votre visibilité.'
    },
    {
      icon: '🗺️',
      title: 'Zone d\'Intervention',
      description: 'Définissez votre rayon d\'action. Les commandes au-delà génèrent des frais de déplacement supplémentaires.'
    },
    {
      icon: '🔄',
      title: 'Gestion des Annulations',
      description: 'Annulez si nécessaire avec un système de frais équitable : 0 MAD (>2h), 20 MAD (1-2h), 50 MAD (<1h).'
    }
  ];

  const earnings = [
    {
      title: 'Commission GlamGo',
      value: '20%',
      description: 'Prélevée sur chaque prestation pour couvrir la plateforme, le support et le marketing.'
    },
    {
      title: 'Vos Revenus',
      value: '80%',
      description: 'Du montant total de la prestation (hors pourboire qui est 100% pour vous).'
    },
    {
      title: 'Pourboires',
      value: '100%',
      description: 'Les pourboires laissés par les clients vous reviennent intégralement.'
    }
  ];

  const cancellationFees = [
    { delay: 'Plus de 2h avant', fee: '0 MAD', color: '#22c55e' },
    { delay: 'Entre 1h et 2h', fee: '20 MAD', color: '#f59e0b' },
    { delay: 'Moins de 1h', fee: '50 MAD', color: '#ef4444' },
    { delay: 'No-show', fee: '100 MAD', color: '#dc2626' }
  ];

  return (
    <div className={styles.howItWorksPage}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroTabs}>
            <Link href="/how-it-works/client" className={styles.heroTab}>
              👤 Client
            </Link>
            <Link href="/how-it-works/provider" className={`${styles.heroTab} ${styles.active}`}>
              💼 Prestataire
            </Link>
          </div>
          <h1 className={styles.title}>Comment devenir prestataire ?</h1>
          <p className={styles.subtitle}>
            Guide complet pour proposer vos services sur GlamGo et développer votre activité
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

        <section className={styles.earningsSection}>
          <h2 className={styles.sectionTitle}>Vos Revenus</h2>
          <p className={styles.sectionSubtitle}>Tarification transparente et équitable</p>
          <div className={styles.earningsGrid}>
            {earnings.map((item, index) => (
              <div key={index} className={styles.earningCard}>
                <div className={styles.earningValue}>{item.value}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.cancellationSection}>
          <h2 className={styles.sectionTitle}>Politique d'Annulation</h2>
          <p className={styles.sectionSubtitle}>Frais appliqués si vous annulez une commande acceptée</p>
          <div className={styles.cancellationGrid}>
            {cancellationFees.map((item, index) => (
              <div key={index} className={styles.cancellationCard} style={{ borderLeftColor: item.color }}>
                <span className={styles.cancellationDelay}>{item.delay}</span>
                <span className={styles.cancellationFee} style={{ color: item.color }}>{item.fee}</span>
              </div>
            ))}
          </div>
          <div className={styles.cancellationNote}>
            <p>En cas d'annulation, la commande est automatiquement re-proposée aux autres prestataires disponibles.</p>
          </div>
        </section>

        <section className={styles.benefitsSection}>
          <h2 className={styles.sectionTitle}>Vos Outils Prestataire</h2>
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
            <h2>Prêt à rejoindre GlamGo ?</h2>
            <p>Développez votre activité et atteignez de nouveaux clients à Marrakech</p>
            <div className={styles.ctaButtons}>
              <Link href="/provider/register">
                <Button variant="primary" size="large">
                  Devenir prestataire
                </Button>
              </Link>
              <Link href="/provider/login">
                <Button variant="outline" size="large">
                  J'ai déjà un compte
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
