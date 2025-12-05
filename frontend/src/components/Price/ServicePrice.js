'use client';

import Price from './Price';
import styles from './ServicePrice.module.scss';

export default function ServicePrice({ amount, label = 'Prix de base', inline = false }) {
  // Utiliser span pour l'affichage inline (dans un paragraphe)
  const Container = inline ? 'span' : 'div';

  return (
    <Container className={styles.priceContainer}>
      {!inline && <span className={styles.label}>{label}</span>}
      <span className={styles.value}>
        <Price amount={amount} />
      </span>
    </Container>
  );
}
