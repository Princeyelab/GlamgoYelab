import Link from 'next/link';
import styles from './not-found.module.scss';
import Button from '@/components/Button';

export default function NotFound() {
  return (
    <div className={styles.notFound}>
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Page non trouvée</h2>
        <p className={styles.description}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link href="/">
          <Button variant="primary" size="large">
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    </div>
  );
}
