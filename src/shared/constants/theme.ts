/**
 * Thème YouMe Intelligente
 * Design inspiré de WhatsApp — Mode sombre par défaut, Material Design 3.
 */
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export const YOUME_COLORS = {
  // Couleurs principales WhatsApp-like
  primary: '#00A884',       // Vert WhatsApp
  primaryDark: '#008f6f',
  primaryLight: '#25D366',
  secondary: '#202C33',     // Header sombre
  background: '#111B21',    // Fond principal sombre
  surface: '#1F2C34',       // Surfaces de cartes
  surfaceVariant: '#2A3942', // Surfaces secondaires

  // Bulles de chat
  bubbleOwn: '#005C4B',     // Ma bulle (vert foncé)
  bubbleOther: '#1F2C34',   // Bulle de l'autre (gris foncé)
  bubbleOwnText: '#E9EDEF',
  bubbleOtherText: '#E9EDEF',

  // Textes
  textPrimary: '#E9EDEF',
  textSecondary: '#8696A0',
  textMuted: '#667781',
  textLink: '#53BDEB',

  // États & feedback
  online: '#25D366',
  delivered: '#53BDEB',
  read: '#53BDEB',
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
  divider: '#2A3942',
  inputBackground: '#2A3942',
  placeholder: '#667781',
  badge: '#00A884',

  // Light mode (optionnel)
  lightBackground: '#F0F2F5',
  lightSurface: '#FFFFFF',
  lightBubbleOwn: '#D9FDD3',
  lightBubbleOther: '#FFFFFF',
  lightTextPrimary: '#111B21',
} as const;

export const YOUME_DARK_THEME: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: YOUME_COLORS.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: YOUME_COLORS.primaryDark,
    secondary: YOUME_COLORS.secondary,
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
