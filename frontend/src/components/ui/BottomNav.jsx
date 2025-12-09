'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  ShoppingBag,
  MessageCircle,
  User,
} from 'lucide-react';
import { NotificationBadge } from './Badge';
import styles from './BottomNav.module.scss';

/**
 * BottomNav Component
 * Navigation bottom mobile app-like
 * Fixed en bas, hauteur 64px, 5 items
 * md:hidden (desktop masqué)
 */

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Accueil',
    labelAr: 'الرئيسية',
    icon: Home,
    href: '/',
  },
  {
    id: 'search',
    label: 'Rechercher',
    labelAr: 'بحث',
    icon: Search,
    href: '/services',
  },
  {
    id: 'orders',
    label: 'Commandes',
    labelAr: 'الطلبات',
    icon: ShoppingBag,
    href: '/orders',
  },
  {
    id: 'messages',
    label: 'Messages',
    labelAr: 'الرسائل',
    icon: MessageCircle,
    href: '/messages',
  },
  {
    id: 'profile',
    label: 'Profil',
    labelAr: 'الملف الشخصي',
    icon: User,
    href: '/profile',
  },
];

export function BottomNav({ notifications = {}, language = 'fr', className = '' }) {
  const pathname = usePathname();

  return (
    <nav className={`${styles.bottomNav} ${className}`} role="navigation" aria-label="Navigation principale">
      <div className={styles.container}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const notificationCount = notifications[item.id] || 0;
          const label = language === 'ar' ? item.labelAr : item.label;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={styles.iconWrapper}>
                <Icon className={styles.icon} />
                {notificationCount > 0 && (
                  <NotificationBadge count={notificationCount} className={styles.badge} />
                )}
              </div>
              <span className={styles.label}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * BottomNavSpacer Component
 * Spacer pour éviter que le contenu soit caché par le bottom nav
 * Utiliser en bas de page
 */
export function BottomNavSpacer({ className = '' }) {
  return <div className={`${styles.spacer} ${className}`} aria-hidden="true" />;
}
