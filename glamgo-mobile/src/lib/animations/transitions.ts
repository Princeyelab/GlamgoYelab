/**
 * Animation Transitions - GlamGo Mobile
 * Configuration des animations avec Reanimated
 */

import { Easing } from 'react-native-reanimated';

// Spring animation config
export const SPRING_CONFIG = {
  damping: 15,
  mass: 0.5,
  stiffness: 150,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Timing animation config
export const TIMING_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

// Fast timing for micro-interactions
export const FAST_TIMING = {
  duration: 150,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

// Slow timing for page transitions
export const SLOW_TIMING = {
  duration: 500,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

// Fade in animation keyframes
export const fadeIn = {
  0: { opacity: 0, scale: 0.95 },
  1: { opacity: 1, scale: 1 },
};

// Fade out animation keyframes
export const fadeOut = {
  0: { opacity: 1, scale: 1 },
  1: { opacity: 0, scale: 0.95 },
};

// Slide up animation keyframes
export const slideUp = {
  0: { translateY: 50, opacity: 0 },
  1: { translateY: 0, opacity: 1 },
};

// Slide down animation keyframes
export const slideDown = {
  0: { translateY: -50, opacity: 0 },
  1: { translateY: 0, opacity: 1 },
};

// Slide in from right animation keyframes
export const slideInFromRight = {
  0: { translateX: 100, opacity: 0 },
  1: { translateX: 0, opacity: 1 },
};

// Slide in from left animation keyframes
export const slideInFromLeft = {
  0: { translateX: -100, opacity: 0 },
  1: { translateX: 0, opacity: 1 },
};

// Scale in animation keyframes
export const scaleIn = {
  0: { scale: 0.8, opacity: 0 },
  1: { scale: 1, opacity: 1 },
};

// Bounce animation keyframes
export const bounce = {
  0: { scale: 1 },
  0.5: { scale: 1.1 },
  1: { scale: 1 },
};

// Pulse animation keyframes
export const pulse = {
  0: { scale: 1, opacity: 1 },
  0.5: { scale: 1.05, opacity: 0.8 },
  1: { scale: 1, opacity: 1 },
};

// Stagger delay calculator
export const getStaggerDelay = (index: number, baseDelay: number = 50): number => {
  return index * baseDelay;
};

export default {
  SPRING_CONFIG,
  TIMING_CONFIG,
  FAST_TIMING,
  SLOW_TIMING,
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  slideInFromRight,
  slideInFromLeft,
  scaleIn,
  bounce,
  pulse,
  getStaggerDelay,
};
