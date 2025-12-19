/**
 * Accessibility Utilities - GlamGo Mobile
 * Helpers pour l'accessibilité
 */

import { AccessibilityRole } from 'react-native';

/**
 * Generate accessibility label with optional hint
 */
export const getAccessibilityLabel = (label: string, hint?: string): string => {
  return hint ? `${label}. ${hint}` : label;
};

/**
 * Get accessibility role from type
 */
export const getAccessibilityRole = (type: string): AccessibilityRole => {
  const roles: Record<string, AccessibilityRole> = {
    button: 'button',
    link: 'link',
    header: 'header',
    image: 'image',
    text: 'text',
    search: 'search',
    tab: 'tab',
    checkbox: 'checkbox',
    radio: 'radio',
    switch: 'switch',
    slider: 'adjustable',
    menu: 'menu',
    menuitem: 'menuitem',
    alert: 'alert',
    progressbar: 'progressbar',
    timer: 'timer',
  };
  return roles[type] || 'none';
};

/**
 * Generate accessibility state object
 */
export const getAccessibilityState = (options: {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean | 'mixed';
  busy?: boolean;
  expanded?: boolean;
}) => {
  return {
    disabled: options.disabled,
    selected: options.selected,
    checked: options.checked,
    busy: options.busy,
    expanded: options.expanded,
  };
};

/**
 * Format currency for screen readers
 */
export const formatCurrencyForA11y = (amount: number, currency: string = 'MAD'): string => {
  return `${amount} dirhams marocains`;
};

/**
 * Format date for screen readers
 */
export const formatDateForA11y = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format time for screen readers
 */
export const formatTimeForA11y = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  return `${hours} heures ${minutes}`;
};

/**
 * Format rating for screen readers
 */
export const formatRatingForA11y = (rating: number, maxRating: number = 5): string => {
  return `${rating} sur ${maxRating} étoiles`;
};

/**
 * Format distance for screen readers
 */
export const formatDistanceForA11y = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} mètres`;
  }
  return `${distanceKm.toFixed(1)} kilomètres`;
};

export default {
  getAccessibilityLabel,
  getAccessibilityRole,
  getAccessibilityState,
  formatCurrencyForA11y,
  formatDateForA11y,
  formatTimeForA11y,
  formatRatingForA11y,
  formatDistanceForA11y,
};
