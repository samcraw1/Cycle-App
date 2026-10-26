/**
 * Warm, neutral palette with a single accent. No pink-everything.
 * Contrast pairs checked for WCAG AA at body sizes.
 */
export const palette = {
  sand50: '#FAF7F3',
  sand100: '#F6F1EC',
  sand200: '#EBE3DA',
  sand300: '#D9CEC2',
  stone500: '#8A7F75',
  stone700: '#5C534B',
  stone900: '#2B2622',
  ink950: '#1C1917',
  ink900: '#262220',
  ink800: '#332E2A',
  ink700: '#4A433E',
  ink300: '#B8ADA3',
  ink100: '#EDE6DF',
  clay500: '#B8623E',
  clay400: '#D07B55',
  clay100: '#F4E3DA',
  clay900: '#5E3020',
  sage500: '#6F8F7A',
  sage100: '#E2EBE5',
  amber500: '#C5892A',
  amber100: '#F7EBD4',
  rose500: '#B9535E',
  rose100: '#F5DEE1',
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  period: string;
  periodSoft: string;
  predicted: string;
  predictedSoft: string;
  info: string;
  danger: string;
  dangerSoft: string;
}

export const lightColors: ThemeColors = {
  background: palette.sand100,
  surface: palette.sand50,
  surfaceAlt: palette.sand200,
  border: palette.sand300,
  text: palette.ink950,
  textMuted: palette.stone700,
  accent: palette.clay500,
  accentSoft: palette.clay100,
  onAccent: palette.sand50,
  period: palette.clay500,
  periodSoft: palette.clay100,
  predicted: palette.amber500,
  predictedSoft: palette.amber100,
  info: palette.sage500,
  danger: palette.rose500,
  dangerSoft: palette.rose100,
};

export const darkColors: ThemeColors = {
  background: palette.ink950,
  surface: palette.ink900,
  surfaceAlt: palette.ink800,
  border: palette.ink700,
  text: palette.ink100,
  textMuted: palette.ink300,
  accent: palette.clay400,
  accentSoft: palette.clay900,
  onAccent: palette.ink950,
  period: palette.clay400,
  periodSoft: palette.clay900,
  predicted: palette.amber500,
  predictedSoft: '#4A3610',
  info: palette.sage500,
  danger: palette.rose500,
  dangerSoft: '#4B2328',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;
/** Minimum tap target (Apple HIG 44pt; we use 48 for quick logging). */
export const TAP_TARGET = 48;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const satisfies Record<
  string,
  { fontSize: number; lineHeight: number; fontWeight: '400' | '600' | '700' }
>;

export type TypographyVariant = keyof typeof typography;
