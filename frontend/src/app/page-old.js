'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import ServiceCard from '@/components/ServiceCard';
import Card from '@/components/Card';
import apiClient from '@/lib/apiClient';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Récupérer les catégories
        const categoriesRes = await apiClient.getCategories();
        console.log('Categories response:', categoriesRes);
        if (categoriesRes.success && categoriesRes.data) {
          // Gérer différentes structures de réponse
          const categoriesData = Array.isArray(categoriesRes.data)
            ? categoriesRes.data
            : (categoriesRes.data.categories || []);
          setCategories(categoriesData.slice(0, 6)); // Afficher les 6 premières catégories
        }

        // Récupérer les services populaires
        const servicesRes = await apiClient.getAllServices();
        console.log('Services response:', servicesRes);
        if (servicesRes.success && servicesRes.data) {
          // Gérer différentes structures de réponse
          const servicesData = Array.isArray(servicesRes.data)
            ? servicesRes.data
            : (servicesRes.data.services || []);
          setServices(servicesData.slice(0, 6)); // Afficher les 6 premiers services
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Impossible de charger les données. Veuillez réessayer.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const steps = [
    {
      icon: '🔍',
      title: 'Recherchez',
      description: 'Parcourez notre catalogue de services et choisissez celui qui vous convient.',
    },
    {
      icon: '📅',
      title: 'Réservez',
      description: 'Sélectionnez une date et une heure qui vous arrangent.',
    },
    {
      icon: '💳',
      title: 'Payez',
      description: 'Payez en toute sécurité en ligne ou en espèces.',
    },
    {
      icon: '✨',
      title: 'Profitez',
      description: 'Un professionnel qualifié vient chez vous à l\'heure prévue.',
    },
  ];

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>
            Services à domicile à Marrakech
          </h1>
          <p className={styles.heroSubtitle}>
            Beauté, ménage, réparations... Tout ce dont vous avez besoin, à portée de main
          </p>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Rechercher un service..."
            />
            <Button variant="primary">Rechercher</Button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Catégories populaires</h2>
            <p className={styles.sectionSubtitle}>
              Découvrez nos services les plus demandés
            </p>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Chargement des catégories...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <div className={styles.categoriesGrid}>
              {categories.map((category) => (
                <Card
                  key={category.id}
                  title={category.name}
                  clickable
                  elevated
                  onClick={() => {
                    window.location.href = `/categories/${category.id}`;
                  }}
                >
                  <p style={{ color: '#6C757D' }}>{category.description}</p>
                  {category.services_count && (
                    <p style={{ marginTop: '1rem', fontWeight: '600' }}>
                      {category.services_count} services disponibles
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/services">
              <Button variant="outline">Voir toutes les catégories</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.howItWorks}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Comment ça marche ?</h2>
            <p className={styles.sectionSubtitle}>
              Réservez vos services en 4 étapes simples
            </p>
          </div>

          <div className={styles.steps}>
            {steps.map((step, index) => (
              <div key={index} className={styles.step}>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Services populaires</h2>
            <p className={styles.sectionSubtitle}>
              Les services les plus réservés par nos clients
            </p>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Chargement des services...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <div className={styles.servicesGrid}>
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/services">
              <Button variant="primary" size="large">
                Voir tous les services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.cta}>
            <h2>Prêt à commencer ?</h2>
            <p>Inscrivez-vous maintenant et profitez de services de qualité à domicile</p>
            <Link href="/register">
              <Button variant="outline" size="large">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
