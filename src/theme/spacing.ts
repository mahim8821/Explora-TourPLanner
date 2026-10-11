export const Spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24,
  '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64, '6xl': 80,
};

export const Radius = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, full: 999,
};

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  lg: { shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 },
  glow: (color: string) => ({ shadowColor: color, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }),
};
