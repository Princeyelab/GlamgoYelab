'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaUserCircle, FaChevronDown, FaComments } from 'react-icons/fa';
import styles from './Header.module.scss';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NotificationDropdown from '@/components/NotificationDropdown';
import CurrencySelector from '@/components/CurrencySelector';
import UnreadBadge from '@/components/UnreadBadge';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isOnboardingCompleted, getOnboardingPath } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const userMenuRef = useRef(null);
  const howItWorksRef = useRef(null);

  // Fermer les menus quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (howItWorksRef.current && !howItWorksRef.current.contains(event.target)) {
        setHowItWorksOpen(false);
      }
    };

    if (userMenuOpen || howItWorksOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen, howItWorksOpen]);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  // Navigation principale (visible sur tablette et desktop)
  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/services', label: t('nav.services') },
  ];

  // Navigation supplémentaire (visible uniquement sur desktop, dans hamburger sur tablette)
  const extraNavLinks = [];
  if (user) {
    extraNavLinks.push({ href: '/orders', label: t('nav.bookings') });
  }

  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link prefetch={false} href="/" className={styles.logo}>
            <img src="/logo2.jpg" alt="GlamGo" className={styles.logoImage} />
            <span className={styles.logoText}>GlamGo</span>
          </Link>

          <nav className={styles.nav}>
            {/* Navigation principale - visible sur tablette et desktop */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive(link.href) ? styles.active : ''}`}
              >
                {link.label}
              </Link>
            ))}

            {/* Navigation supplémentaire - visible uniquement sur desktop */}
            <div className={styles.desktopNavExtra}>
              {extraNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${isActive(link.href) ? styles.active : ''}`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Dropdown Comment ça marche */}
              <div className={styles.navDropdown} ref={howItWorksRef}>
                <button
                  className={`${styles.navLink} ${styles.navDropdownBtn} ${pathname.startsWith('/how-it-works') ? styles.active : ''}`}
                  onClick={() => setHowItWorksOpen(!howItWorksOpen)}
                >
                  {t('nav.howItWorks')}
                  <FaChevronDown className={`${styles.dropdownChevron} ${howItWorksOpen ? styles.open : ''}`} />
                </button>
                {howItWorksOpen && (
                  <div className={styles.navDropdownMenu}>
                    <Link
                      href="/how-it-works/client"
                      className={styles.navDropdownItem}
                      onClick={() => setHowItWorksOpen(false)}
                    >
                      <span className={styles.dropdownIcon}>👤</span>
                      <div>
                        <strong>{t('nav.iAmClient')}</strong>
                        <small>{t('nav.bookService')}</small>
                      </div>
                    </Link>
                    <Link
                      href="/how-it-works/provider"
                      className={styles.navDropdownItem}
                      onClick={() => setHowItWorksOpen(false)}
                    >
                      <span className={styles.dropdownIcon}>💼</span>
                      <div>
                        <strong>{t('nav.iAmProvider')}</strong>
                        <small>{t('nav.offerServices')}</small>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>

          <div className={styles.actions}>
            <LanguageSwitcher compact />
            <CurrencySelector />
            {user ? (
              <>
                {/* Icônes messages et notifications - visibles sur tablette et desktop */}
                <div className={styles.tabletActions}>
                  <Link prefetch={false} href="/orders" className={styles.messagesIcon} title="Messages">
                    <FaComments />
                    <UnreadBadge />
                  </Link>
                  <NotificationDropdown />
                </div>
                {/* Menu utilisateur visible uniquement sur desktop */}
                <div className={`${styles.userMenu} ${styles.desktopOnly}`} ref={userMenuRef}>
                  <button
                    className={styles.userMenuBtn}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <FaUserCircle className={styles.userIcon} />
                    <span>{user.first_name}</span>
                    <FaChevronDown className={styles.chevronIcon} />
                  </button>

                {userMenuOpen && (
                  <div className={styles.userDropdown}>
                    <Link prefetch={false} href="/profile" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      {t('nav.profile')}
                    </Link>
                    <Link prefetch={false} href="/orders" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      {t('nav.bookings')}
                    </Link>
                    <Link prefetch={false} href="/addresses" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      {t('nav.addresses')}
                    </Link>
                    {user.is_provider && (
                      <Link prefetch={false} href="/provider/dashboard" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                        {t('nav.providerSpace')}
                      </Link>
                    )}
                    <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid #e9ecef' }} />
                    <button className={styles.dropdownItem} onClick={handleLogout}>
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
                </div>
              </>
            ) : (
              <div className={styles.desktopOnly}>
                <Link prefetch={false} href="/provider/register" className={styles.providerLink}>
                  {t('nav.becomeProvider')}
                </Link>
                <Link prefetch={false} href="/login">
                  <Button variant="outline" size="small">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link prefetch={false} href="/register">
                  <Button variant="primary" size="small">
                    {t('nav.register')}
                  </Button>
                </Link>
              </div>
            )}

            <button
              className={`${styles.mobileMenuBtn} ${mobileMenuOpen ? styles.open : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
            </button>
          </div>
        </div>

        {/* Overlay mobile */}
        <div
          className={`${styles.mobileOverlay} ${mobileMenuOpen ? styles.open : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Menu mobile slide-in */}
        <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
          <div className={styles.mobileMenuHeader}>
            <span className={styles.mobileMenuTitle}>{t('nav.menu')}</span>
          </div>

          <div className={styles.mobileMenuContent}>
            {/* Navigation principale - visible uniquement sur mobile */}
            <div className={styles.mobileNavSection}>
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
            </div>

            {/* Navigation supplémentaire - visible sur mobile et tablette */}
            {extraNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Comment ça marche - visible sur mobile et tablette */}
            <div className={styles.mobileDropdownSection}>
              <span className={styles.mobileDropdownTitle}>{t('nav.howItWorks')}</span>
              <Link
                href="/how-it-works/client"
                className={`${styles.mobileNavLink} ${styles.mobileSubLink}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                👤 {t('nav.iAmClient')}
              </Link>
              <Link
                href="/how-it-works/provider"
                className={`${styles.mobileNavLink} ${styles.mobileSubLink}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                💼 {t('nav.iAmProvider')}
              </Link>
            </div>

            {/* Section utilisateur mobile */}
            <div className={styles.mobileUserSection}>
              {user ? (
                <>
                  <div className={styles.mobileUserInfo}>
                    <FaUserCircle className={styles.mobileUserIcon} />
                    <span>{user.first_name} {user.last_name}</span>
                  </div>
                  <Link prefetch={false} href="/profile" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                    {t('nav.profile')}
                  </Link>
                  <Link prefetch={false} href="/addresses" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                    {t('nav.addresses')}
                  </Link>
                  {user.is_provider && (
                    <Link prefetch={false} href="/provider/dashboard" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                      {t('nav.providerSpace')}
                    </Link>
                  )}
                  <button className={styles.mobileLogoutBtn} onClick={handleLogout}>
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={styles.mobileAuthBtn}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    href="/register"
                    className={`${styles.mobileAuthBtn} ${styles.primary}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.register')}
                  </Link>
                  <Link
                    href="/provider/register"
                    className={styles.mobileProviderLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    💼 {t('nav.becomeProvider')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {user && !isOnboardingCompleted() && getOnboardingPath() && (
        <div className={styles.onboardingAlert}>
          <div className={styles.onboardingAlertContent}>
            <span className={styles.onboardingAlertIcon}>⚠️</span>
            <div className={styles.onboardingAlertText}>
              <strong>{t('nav.completeProfile')}</strong>
              <p>{t('nav.completeProfileDesc')}</p>
            </div>
            <Link prefetch={false} href={getOnboardingPath()} className={styles.onboardingAlertButton}>
              {t('nav.completeNow')}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
