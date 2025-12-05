'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.scss';
import ServiceCard from '@/components/ServiceCard';
import apiClient from '@/lib/apiClient';

function ServicesContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category');

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryId || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Récupérer les catégories
        const categoriesRes = await apiClient.getCategories();
        if (categoriesRes.success && categoriesRes.data) {
          const categoriesData = Array.isArray(categoriesRes.data)
            ? categoriesRes.data
            : (categoriesRes.data.categories || []);
          setCategories(categoriesData);
        }

        // Récupérer tous les services
        const servicesRes = await apiClient.getAllServices();
        if (servicesRes.success && servicesRes.data) {
          const servicesData = Array.isArray(servicesRes.data)
            ? servicesRes.data
            : (servicesRes.data.services || []);
          setServices(servicesData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Impossible de charger les services. Veuillez réessayer.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrer les services
  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategory === 'all' || service.category_id === parseInt(selectedCategory);
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.servicesPage}>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.title}>Tous nos services</h1>
          <p className={styles.subtitle}>
            Découvrez notre large gamme de services à domicile à Marrakech
          </p>
        </div>
      </section>

      <div className="container">
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Rechercher un service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.categoryFilters}>
            <button
              className={`${styles.categoryBtn} ${selectedCategory === 'all' ? styles.active : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Tous les services
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`${styles.categoryBtn} ${selectedCategory === String(category.id) ? styles.active : ''}`}
                onClick={() => setSelectedCategory(String(category.id))}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Chargement des services...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : filteredServices.length === 0 ? (
          <div className={styles.noResults}>
            <p>Aucun service trouvé</p>
            <p className={styles.noResultsHint}>
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        ) : (
          <>
            <p className={styles.resultsCount}>
              {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} trouvé{filteredServices.length > 1 ? 's' : ''}
            </p>
            <div className={styles.servicesGrid}>
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #FF6B9D',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Chargement...</p>
        </div>
      </div>
    }>
      <ServicesContent />
    </Suspense>
  );
}
