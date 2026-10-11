import {Platform} from 'react-native';

export const Typography = {
  fontFamily: Platform.select({
    ios: { regular: 'System', bold: 'System', medium: 'System' },
    android: { regular: 'Roboto', bold: 'Roboto', medium: 'Roboto' },
    default: { regular: 'System', bold: 'System', medium: 'System' },
  }),
  size: {
    xs: 10, sm: 12, md: 14, base: 16, lg: 18, xl: 20,
    '2xl': 24, '3xl': 28, '4xl': 32, '5xl': 40, '6xl': 48,
  },
  weight: {
    thin: '200' as const, light: '300' as const, regular: '400' as const,
    medium: '500' as const, semiBold: '600' as const, bold: '700' as const, heavy: '800' as const,
  },
  lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.7 },
  letterSpacing: { tight: -0.5, normal: 0, wide: 0.5, wider: 1, widest: 2 },
};
