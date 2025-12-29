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
    try {
      if (!hapticsEnabled || Platform.OS === 'web') return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Silently ignore haptics errors
    }
  },

  /**
   * Medium impact - for standard interactions
   * Use for: primary buttons, card presses
   */
  medium: () => {
    try {
      if (!hapticsEnabled || Platform.OS === 'web') return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // Silently ignore haptics errors
    }
  },

  /**
   * Heavy impact - for significant interactions
   * Use for: important actions, confirmations
   */
  heavy: () => {
    try {
      if (!hapticsEnabled || Platform.OS === 'web') return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {
      // Silently ignore haptics errors
    }
  },

  /**
   * Success notification - for successful actions
   * Use for: booking confirmed, payment success
   */
  success: () => {
    try {
      if (!hapticsEnabled || Platform.OS === 'web') return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Silently ignore haptics errors
    }
  },

  /**
   * Warning notification - for warnings
   * Use for: low battery, network issues
   */
  warning: () => {
    try {
      if (!hapticsEnabled || Platform.OS === 'web') return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      // Silently ignore haptics errors
    }
  },

  /**
   * Error notification - for errors
   * Use for: form validation errors, failed actions
   */
  error: () => {
    try {
      if (!hapticsEnabled || Platform.OS === 'web') return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      // Silently ignore haptics errors
    }
  },

  /**
   * Selection change - for selection feedback
   * Use for: picker changes, tab switches, list selections
   */
  selection: () => {
    try {
      if (!hapticsEnabled || Platform.OS === 'web') return;
      Haptics.selectionAsync();
    } catch (e) {
      // Silently ignore haptics errors
    }
  },
};

export default hapticFeedback;
