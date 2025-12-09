'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageDropdown from './LanguageDropdown';
import styles from './Header.module.scss';

/**
 * Header Desktop Moderne App-Like
 *
 * Design moderne avec :
 * - Logo gradient minimaliste
 * - Navigation horizontale active state
 * - Search button rond
 * - Language dropdown 5 langues
 * - CTA "Commencer gratuitement" pill shape
 * - Mobile menu pour tablet
 * - Masqué sur mobile < 768px (BottomNav prend le relais)
 */
export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll pour ajouter shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navLinks = [
    { href: '/', label: t('nav.home') || 'Accueil' },
    { href: '/services', label: t('nav.services') || 'Services' },
    { href: '/how-it-works', label: t('nav.howItWorks') || 'Comment ça marche' },
    { href: '/provider/register', label: t('nav.becomeProvider') || 'Devenir prestataire' },
  ];

  return (
    <header
      className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}
      data-mobile-hidden="true"
    >
      <div className={styles.container}>
        {/* Logo moderne avec gradient */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Sparkles className={styles.logoSparkle} />
          </div>
          <span className={styles.logoText}>GlamGo</span>
        </Link>

        {/* Navigation Desktop (masquée tablet) */}
        <nav className={styles.nav} role="navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${isActive(link.href) ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions droite */}
        <div className={styles.actions}>
          {/* Search button rond */}
          <button
            className={styles.searchBtn}
            aria-label="Rechercher"
            title="Rechercher un service"
          >
            <Search className={styles.searchIcon} />
          </button>

          {/* Language Dropdown */}
          <LanguageDropdown />

          {/* CTA "Commencer gratuitement" */}
          {!user && (
            <Link href="/register" className={styles.ctaBtn}>
              {t('nav.startFree') || 'Commencer gratuitement'}
            </Link>
          )}

          {/* User menu si connecté */}
          {user && (
            <Link href="/profile" className={styles.userBtn}>
              <div className={styles.userAvatar}>
                {user.first_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className={styles.userName}>{user.first_name}</span>
            </Link>
          )}

          {/* Burger menu (tablet 768-1024px) */}
          <button
            className={`${styles.burgerBtn} ${mobileMenuOpen ? styles.open : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={styles.burgerLine}></span>
            <span className={styles.burgerLine}></span>
            <span className={styles.burgerLine}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay (tablet) */}
      {mobileMenuOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className={styles.mobileMenu}>
            <nav className={styles.mobileNav}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.active : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {user && (
              <div className={styles.mobileUserSection}>
                <Link
                  href="/profile"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.profile') || 'Profil'}
                </Link>
                <Link
                  href="/orders"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.bookings') || 'Mes réservations'}
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
