import React from 'react';
import styles from './Badge.module.scss';

/**
 * Badge Component
 * Pill-shaped badge pour catégories, status, notifications
 *
 * Variants:
 * - default: Gris neutre
 * - primary: Rose GlamGo
 * - secondary: Bleu
 * - accent: Gold
 * - success: Vert
 * - warning: Orange
 * - error: Rouge
 *
 * Sizes:
 * - sm: Small (24px height)
 * - md: Medium (32px height) - default
 * - lg: Large (40px height)
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className = '',
  ...props
}) {
  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={styles.dot} />}
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{children}</span>
    </span>
  );
}

/**
 * BadgeGroup Component
 * Container pour plusieurs badges
 */
export function BadgeGroup({ children, className = '', ...props }) {
  return (
    <div className={`${styles.badgeGroup} ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * StatusBadge Component
 * Badge spécialisé pour status avec mapping automatique
 */
export function StatusBadge({ status, className = '', ...props }) {
  const statusMap = {
    // Order statuses
    pending: { variant: 'warning', label: 'En attente', dot: true },
    confirmed: { variant: 'primary', label: 'Confirmée', dot: true },
    in_progress: { variant: 'secondary', label: 'En cours', dot: true },
    completed: { variant: 'success', label: 'Terminée', dot: true },
    cancelled: { variant: 'error', label: 'Annulée', dot: true },

    // Provider statuses
    active: { variant: 'success', label: 'Actif', dot: true },
    inactive: { variant: 'default', label: 'Inactif', dot: true },
    suspended: { variant: 'error', label: 'Suspendu', dot: true },

    // Availability
    available: { variant: 'success', label: 'Disponible', dot: true },
    unavailable: { variant: 'error', label: 'Indisponible', dot: true },
    busy: { variant: 'warning', label: 'Occupé', dot: true },
  };

  const config = statusMap[status] || { variant: 'default', label: status, dot: false };

  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      className={className}
      {...props}
    >
      {config.label}
    </Badge>
  );
}

/**
 * NotificationBadge Component
 * Badge de notification circulaire avec count
 */
export function NotificationBadge({ count, max = 99, className = '', ...props }) {
  if (!count || count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span className={`${styles.notificationBadge} ${className}`} {...props}>
      {displayCount}
    </span>
  );
}
