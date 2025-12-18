import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacing, typography, shadows } from '../../lib/constants/theme';
import { useAppSelector } from '../../lib/store/hooks';
import { selectUpcomingBookings } from '../../lib/store/slices/bookingsSlice';
import { selectFavorites } from '../../lib/store/slices/servicesSlice';

// Tab configuration
const TAB_CONFIG: Record<string, { icon: string; activeIcon: string; label: string }> = {
  index: { icon: '🏠', activeIcon: '🏠', label: 'Accueil' },
  services: { icon: '💇', activeIcon: '💇', label: 'Services' },
  bookings: { icon: '📅', activeIcon: '📅', label: 'Reservations' },
  favorites: { icon: '🤍', activeIcon: '❤️', label: 'Favoris' },
  profile: { icon: '👤', activeIcon: '👤', label: 'Profil' },
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const upcomingBookings = useAppSelector(selectUpcomingBookings);
  const favorites = useAppSelector(selectFavorites);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || { icon: '•', activeIcon: '•', label: route.name };

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
                style={[styles.label, isFocused && styles.labelActive]}
                numberOfLines={1}
              >
                {config.label}
              </Text>
              {isFocused && <View style={styles.activeIndicator} />}
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
});
