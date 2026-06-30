/**
 * Thème YouMe Intelligente
 * Design inspiré de WhatsApp — Mode sombre par défaut, Material Design 3.
 */
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export const YOUME_COLORS = {
  // Couleurs principales — dégradé du logo YouMe (bleu → violet → rose)
  gradientStart: '#1B80FB',  // Bleu (logo)
  gradientMid: '#A347C8',    // Violet (logo)
  gradientEnd: '#FD46A5',    // Rose (logo)

  primary: '#A347C8',        // Violet — couleur d'accent principale
  primaryDark: '#7B2FF0',
  primaryLight: '#FD46A5',
  secondary: '#241B3A',      // Header sombre teinté violet
  background: '#14101F',     // Fond principal sombre (violet très foncé)
  surface: '#1F1730',        // Surfaces de cartes
  surfaceVariant: '#2C2240', // Surfaces secondaires

  // Bulles de chat
  bubbleOwn: '#5A2D8C',      // Ma bulle (violet foncé)
  bubbleOther: '#1F1730',    // Bulle de l'autre
  bubbleOwnText: '#F2EAFB',
  bubbleOtherText: '#F2EAFB',

  // Textes
  textPrimary: '#F2EAFB',
  textSecondary: '#A99BC2',
  textMuted: '#7A6B95',
  textLink: '#FD46A5',

  // États & feedback
  online: '#25D366',
  delivered: '#53BDEB',
  read: '#FD46A5',
  error: '#F15C6D',
  warning: '#FFB04C',
  success: '#25D366',

  // Émotions
  emotionJoy: '#FFD700',
  emotionSadness: '#6495ED',
  emotionAnger: '#FF4444',
  emotionFear: '#9370DB',
  emotionSurprise: '#FF8C00',
  emotionNeutral: '#9E9E9E',

  // Cohérence IA
  coherenceHigh: '#25D366',
  coherenceMedium: '#FFB04C',
  coherenceLow: '#F15C6D',

  // Interface
  divider: '#2C2240',
  inputBackground: '#2C2240',
  placeholder: '#7A6B95',
  badge: '#FD46A5',

  // Light mode (optionnel)
  lightBackground: '#F6F0FB',
  lightSurface: '#FFFFFF',
  lightBubbleOwn: '#F0DDFB',
  lightBubbleOther: '#FFFFFF',
  lightTextPrimary: '#241B3A',
} as const;

export const YOUME_DARK_THEME: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: YOUME_COLORS.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: YOUME_COLORS.primaryDark,
    secondary: YOUME_COLORS.secondary,
    tertiary: YOUME_COLORS.gradientStart,
    background: YOUME_COLORS.background,
    surface: YOUME_COLORS.surface,
    surfaceVariant: YOUME_COLORS.surfaceVariant,
    onSurface: YOUME_COLORS.textPrimary,
    onSurfaceVariant: YOUME_COLORS.textSecondary,
    outline: YOUME_COLORS.divider,
    error: YOUME_COLORS.error,
  },
};

export const YOUME_LIGHT_THEME: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: YOUME_COLORS.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: YOUME_COLORS.lightBubbleOwn,
    secondary: YOUME_COLORS.gradientEnd,
    tertiary: YOUME_COLORS.gradientStart,
    background: YOUME_COLORS.lightBackground,
    surface: YOUME_COLORS.lightSurface,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
  bubble: 18,
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    heading: 28,
  },
} as const;

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;
