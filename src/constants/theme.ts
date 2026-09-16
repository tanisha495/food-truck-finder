import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const shadows = {
  card: {
    boxShadow: '0 6px 18px rgba(34, 28, 22, 0.08)',
  },
  subtle: {
    boxShadow: '0 2px 8px rgba(34, 28, 22, 0.06)',
  },
} as const;

export const theme = {
  colors,
  spacing,
  typography,
  radius,
  shadows,
} as const;

export type AppTheme = typeof theme;
