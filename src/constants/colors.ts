export const colors = {
  primary: '#D85A30',
  primaryDark: '#993C1D',
  background: '#FBF8F4',
  surface: '#FFFFFF',
  text: '#221C16',
  textMuted: '#5A5249',
  border: '#E7E0D6',
  success: '#1D7A52',
  danger: '#C0392B',
} as const;

export type ColorName = keyof typeof colors;
