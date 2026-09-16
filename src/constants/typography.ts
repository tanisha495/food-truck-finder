import { Platform, type TextStyle } from 'react-native';

export const fontFamilies = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
  },
  default: {
    sans: 'normal',
    serif: 'serif',
  },
}) ?? {
  sans: 'normal',
  serif: 'serif',
};

const headingLarge: TextStyle = {
  fontFamily: fontFamilies.serif,
  fontSize: 32,
  fontWeight: '700',
  lineHeight: 38,
};

const headingMedium: TextStyle = {
  fontFamily: fontFamilies.serif,
  fontSize: 24,
  fontWeight: '700',
  lineHeight: 30,
};

const headingSmall: TextStyle = {
  fontFamily: fontFamilies.serif,
  fontSize: 20,
  fontWeight: '700',
  lineHeight: 25,
};

const body: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: 16,
  fontWeight: '400',
  lineHeight: 24,
};

const bodySmall: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: 14,
  fontWeight: '400',
  lineHeight: 20,
};

const label: TextStyle = {
  fontFamily: fontFamilies.sans,
  fontSize: 13,
  fontWeight: '600',
  lineHeight: 18,
};

export const typography = {
  headingLarge,
  headingMedium,
  headingSmall,
  body,
  bodySmall,
  label,
} as const;

export type TypographyName = keyof typeof typography;
