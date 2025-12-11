import Link from 'next/link';

// Styles inlinés pour éviter le warning de preload CSS
const inlineStyles = {
  notFound: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
    color: '#FFFFFF',
    textAlign: 'center',
    padding: '1.5rem',
  },
  content: {
    maxWidth: '600px',
  },
  title: {
    fontSize: '8rem',
    fontWeight: 800,
    marginBottom: '1.5rem',
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  subtitle: {
    fontSize: '1.875rem',
    fontWeight: 700,
    marginBottom: '1rem',
  },
  description: {
    fontSize: '1.125rem',
    marginBottom: '4rem',
    opacity: 0.9,
  },
  button: {
    display: 'inline-block',
    padding: '1rem 2rem',
    backgroundColor: '#FFFFFF',
    color: '#FF6B6B',
    borderRadius: '0.5rem',
    fontWeight: 600,
    fontSize: '1rem',
    textDecoration: 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
};

export default function NotFound() {
  return (
    <div style={inlineStyles.notFound}>
      <div style={inlineStyles.content}>
        <h1 style={inlineStyles.title}>404</h1>
        <h2 style={inlineStyles.subtitle}>Page non trouvée</h2>
        <p style={inlineStyles.description}>
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link href="/" style={inlineStyles.button}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
