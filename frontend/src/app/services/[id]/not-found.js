import Link from 'next/link';
import Button from '@/components/Button';

export default function ServiceNotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#2C3E50' }}>
        Service introuvable
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#6c757d', marginBottom: '2rem' }}>
        Le service que vous recherchez n'existe pas ou a été supprimé.
      </p>
      <Link href="/services">
        <Button variant="primary" size="large">
          Retour aux services
        </Button>
      </Link>
    </div>
  );
}
