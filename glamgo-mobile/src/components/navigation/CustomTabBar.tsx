import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacing, typography, shadows, getFontFamily } from '../../lib/constants/theme';
import { useAppSelector } from '../../lib/store/hooks';
import { selectUpcomingBookings } from '../../lib/store/slices/bookingsSlice';
import { selectFavorites } from '../../lib/store/slices/servicesSlice';
import { useLanguage } from '../../contexts/LanguageContext';

type TabMode = 'client' | 'provider';

// Tab configuration for CLIENT mode - using translation keys
const CLIENT_TAB_CONFIG: Record<string, { icon: string; activeIcon: string; labelKey: string }> = {
  index: { icon: '🏠', activeIcon: '🏠', labelKey: 'nav.home' },
  services: { icon: '💇', activeIcon: '💇', labelKey: 'nav.services' },
  bookings: { icon: '📅', activeIcon: '📅', labelKey: 'nav.bookings' },
  favorites: { icon: '🤍', activeIcon: '❤️', labelKey: 'profile.favorites' },
  profile: { icon: '👤', activeIcon: '👤', labelKey: 'nav.profile' },
};

// Tab configuration for PROVIDER mode - using translation keys
const PROVIDER_TAB_CONFIG: Record<string, { icon: string; activeIcon: string; labelKey: string }> = {
  index: { icon: '📊', activeIcon: '📊', labelKey: 'provider.dashboard' },
  bookings: { icon: '📅', activeIcon: '📅', labelKey: 'provider.requests' },
  profile: { icon: '👤', activeIcon: '👤', labelKey: 'nav.profile' },
  booking: { icon: '🚗', activeIcon: '🚗', labelKey: 'location.directions' },
  onboarding: { icon: '⚙️', activeIcon: '⚙️', labelKey: 'nav.services' },
};

interface CustomTabBarProps extends BottomTabBarProps {
  mode?: TabMode;
}

export default function CustomTabBar({ state, descriptors, navigation, mode = 'client' }: CustomTabBarProps) {
  const upcomingBookings = useAppSelector(selectUpcomingBookings);
  const favorites = useAppSelector(selectFavorites);
  const { t, isRTL } = useLanguage();

  // Use the appropriate tab config based on mode
  const TAB_CONFIG = mode === 'provider' ? PROVIDER_TAB_CONFIG : CLIENT_TAB_CONFIG;

  // Filtrer les routes pour n'afficher que celles configurées dans TAB_CONFIG
  const visibleRoutes = state.routes.filter(route => TAB_CONFIG[route.name] !== undefined);

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, mode === 'provider' && styles.providerTabBar]}>
        {visibleRoutes.map((route) => {
          const routeIndex = state.routes.findIndex(r => r.key === route.key);
          const { options } = descriptors[route.key];
          const isFocused = state.index === routeIndex;
          const config = TAB_CONFIG[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Badge counts
          let badgeCount = 0;
          if (route.name === 'bookings') {
            badgeCount = upcomingBookings.length;
          } else if (route.name === 'favorites') {
            badgeCount = favorites.length;
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={`tab-${route.name}`}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Text style={[styles.icon, isFocused && styles.iconActive]}>
                  {isFocused ? config.activeIcon : config.icon}
                </Text>
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isFocused && styles.labelActive,
                  mode === 'provider' && styles.labelProvider,
                  mode === 'provider' && isFocused && styles.labelProviderActive,
                  { fontFamily: getFontFamily(isRTL, 'medium') },
                ]}
                numberOfLines={1}
              >
                {t(config.labelKey)}
              </Text>
              {isFocused && (
                <View style={[
                  styles.activeIndicator,
                  mode === 'provider' && styles.activeIndicatorProvider,
                ]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    ...shadows.lg,
  },
  providerTabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.primary + '20',
    borderTopWidth: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacing.xs,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    fontWeight: typography.fontWeight.medium,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  // Provider mode styles
  labelProvider: {
    color: colors.gray[500],
  },
  labelProviderActive: {
    color: colors.primary,
  },
  activeIndicatorProvider: {
    backgroundColor: colors.primary,
  },
});
