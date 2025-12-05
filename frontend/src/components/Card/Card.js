'use client';

import styles from './Card.module.scss';

export default function Card({
  children,
  title,
  subtitle,
  footer,
  clickable = false,
  bordered = false,
  elevated = false,
  onClick,
  className = '',
}) {
  const cardClasses = [
    styles.card,
    clickable && styles.clickable,
    bordered && styles.bordered,
    elevated && styles.elevated,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses} onClick={clickable ? onClick : undefined}>
      {(title || subtitle) && (
        <div className={styles.cardHeader}>
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
          {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        </div>
      )}

      <div className={styles.cardBody}>{children}</div>

      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </div>
  );
}
