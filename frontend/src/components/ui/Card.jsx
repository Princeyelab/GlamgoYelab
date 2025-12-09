import React from 'react';
import styles from './Card.module.scss';

/**
 * Card Component
 * Carte de contenu avec shadow et animations hover
 * Utilisée pour ServiceCard, ProviderCard, etc.
 */
export function Card({
  children,
  onClick,
  className = '',
  hoverable = true,
  ...props
}) {
  return (
    <div
      className={`${styles.card} ${hoverable ? styles.hoverable : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardImage Component
 * Image container avec badge support
 */
export function CardImage({
  src,
  alt,
  badge,
  className = '',
  aspectRatio = '4/3',
  ...props
}) {
  return (
    <div
      className={`${styles.cardImage} ${className}`}
      style={{ '--aspect-ratio': aspectRatio }}
      {...props}
    >
      <img src={src} alt={alt} loading="lazy" />
      {badge && (
        <div className={styles.cardBadge}>
          {badge}
        </div>
      )}
    </div>
  );
}

/**
 * CardContent Component
 * Container pour le contenu de la carte
 */
export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`${styles.cardContent} ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * CardTitle Component
 * Titre de la carte avec clamp
 */
export function CardTitle({
  children,
  className = '',
  lines = 2,
  ...props
}) {
  return (
    <h3
      className={`${styles.cardTitle} ${className}`}
      style={{ '--line-clamp': lines }}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * CardDescription Component
 * Description de la carte avec clamp
 */
export function CardDescription({
  children,
  className = '',
  lines = 3,
  ...props
}) {
  return (
    <p
      className={`${styles.cardDescription} ${className}`}
      style={{ '--line-clamp': lines }}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * CardFooter Component
 * Footer de la carte pour actions/info
 */
export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`${styles.cardFooter} ${className}`} {...props}>
      {children}
    </div>
  );
}
