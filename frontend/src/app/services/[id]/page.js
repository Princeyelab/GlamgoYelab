import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import { getServiceById } from '@/lib/serverApi';
import { getServiceImageUrl } from '@/lib/serviceImages';
import { fixEncoding } from '@/lib/textUtils';
import ServicePrice from '@/components/Price/ServicePrice';

export const revalidate = 300; // 5 minutes

export async function generateMetadata({ params }) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) {
    return {
      title: 'Service introuvable - GlamGo',
    };
  }

  return {
    title: `${service.name} - GlamGo`,
    description: service.description,
  };
}

export default async function ServiceDetailPage({ params }) {
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) {
    notFound();
  }

  const {
    name,
    description,
    price,
    base_price,
    category_name,
    average_rating,
    total_reviews,
    estimated_duration,
    duration_minutes,
    allow_bidding,
    min_suggested_price,
    max_suggested_price,
  } = service;

  const imageUrl = getServiceImageUrl(service, '800x600');
  const displayPrice = price || base_price;
  const displayDuration = estimated_duration || (duration_minutes ? `${duration_minutes} min` : null);

  // Mode enchères désactivé - Toujours utiliser le mode classique
  const isBiddingEnabled = false;

  return (
    <div className={styles.serviceDetailPage}>
      <div className="container">
        <Link href="/services" className={styles.backLink}>
          ← Retour aux services
        </Link>

        <div className={styles.serviceDetail}>
          <div className={styles.imageSection}>
            <img
              src={imageUrl}
              alt={fixEncoding(name)}
              className={styles.image}
            />
          </div>

          <div className={styles.contentSection}>
            {category_name && <span className={styles.category}>{fixEncoding(category_name)}</span>}

            <h1 className={styles.title}>{fixEncoding(name)}</h1>

            {average_rating && (
              <div className={styles.rating}>
                <span className={styles.star}>★</span>
                <span className={styles.ratingValue}>
                  {parseFloat(average_rating).toFixed(1)}
                </span>
                <span className={styles.reviewsCount}>
                  ({total_reviews || 0} avis)
                </span>
              </div>
            )}

            <p className={styles.description}>{fixEncoding(description)}</p>

            {isBiddingEnabled && (
              <div className={styles.biddingBanner}>
                <div className={styles.biddingIcon}>🎯</div>
                <div className={styles.biddingInfo}>
                  <strong>Mode enchères disponible</strong>
                  <p>Proposez votre prix et recevez des offres de plusieurs prestataires</p>
                  <p className={styles.priceRange}>
                    Prix à partir de: <ServicePrice amount={displayPrice} inline={true} /> (sans limite maximale)
                  </p>
                </div>
              </div>
            )}

            <div className={styles.details}>
              {!isBiddingEnabled && displayPrice && (
                <ServicePrice amount={displayPrice} label="Prix de base" />
              )}

              {displayDuration && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Durée estimée</span>
                  <span className={styles.detailValue}>⏱ {displayDuration}</span>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <Link href={`/booking/${id}${isBiddingEnabled ? '?mode=bidding' : ''}`}>
                <Button variant="primary" size="large">
                  {isBiddingEnabled ? '💰 Demander des offres' : 'Réserver maintenant'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
