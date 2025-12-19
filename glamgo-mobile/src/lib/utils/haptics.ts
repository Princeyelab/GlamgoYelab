/**
 * Haptic Feedback Utility - GlamGo Mobile
 * Retours haptiques pour les interactions
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Check if haptics are enabled (can be stored in settings)
let hapticsEnabled = true;

export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = enabled;
};

export const isHapticsEnabled = () => hapticsEnabled;

/**
 * Haptic feedback functions
 */
export const hapticFeedback = {
  /**
   * Light impact - for subtle interactions
   * Use for: toggles, checkboxes, small buttons
   */
  light: () => {
    if (!hapticsEnabled || Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Medium impact - for standard interactions
   * Use for: primary buttons, card presses
   */
  medium: () => {
    if (!hapticsEnabled || Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Heavy impact - for significant interactions
   * Use for: important actions, confirmations
   */
  heavy: () => {
    if (!hapticsEnabled || Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Success notification - for successful actions
   * Use for: booking confirmed, payment success
   */
  success: () => {
    if (!hapticsEnabled || Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Warning notification - for warnings
   * Use for: low battery, network issues
   */
  warning: () => {
    if (!hapticsEnabled || Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Error notification - for errors
   * Use for: form validation errors, failed actions
   */
  error: () => {
    if (!hapticsEnabled || Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Selection change - for selection feedback
   * Use for: picker changes, tab switches, list selections
   */
  selection: () => {
    if (!hapticsEnabled || Platform.OS === 'web') return;
    Haptics.selectionAsync();
  },
};

export default hapticFeedback;
