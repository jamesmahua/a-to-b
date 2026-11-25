/**
 * @repo/tokens — the design values every app uses.
 *
 * Plug-and-play theming: apps only ever read `theme.color.brandPrimary`,
 * `theme.space[4]` and so on, never raw hex codes. To restyle all four apps,
 * edit a theme below or change `ACTIVE_THEME`.
 *
 * Final design is deferred (spec §7). Two themes are ready:
 *   kolleka – the design system's Ink + Kolleka Lime proposal
 *   orange  – the orange brand currently on the marketing site
 */

export interface Theme {
  name: string
  color: {
    brandPrimary: string
    /** Text/icons on top of brandPrimary. */
    onBrandPrimary: string
    brandPrimarySoft: string
    surfacePage: string
    surfaceCard: string
    surfaceSunken: string
    textStrong: string
    textBody: string
    textMuted: string
    textInverse: string
    borderSubtle: string
    borderStrong: string
    success: string
    warning: string
    danger: string
    info: string
    /** One accent per vertical, for tags and tiles only. */
    vertical: { food: string; retail: string; essentials: string; parcels: string; services: string }
  }
  font: {
    display: string
    body: string
    mono: string
  }
}

const shared = {
  space: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 },
  radius: { sm: 6, md: 10, lg: 14, xl: 20, full: 999 },
  text: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36 },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  /** Minimum touch target (accessibility; mid-range Android). */
  touch: 48,
} as const

export const themes = {
  kolleka: {
    name: 'Klick&Kolleka (Ink + Lime)',
    color: {
      brandPrimary: '#C6F24E',
      onBrandPrimary: '#14120F',
      brandPrimarySoft: '#F1FBD3',
      surfacePage: '#F8F6F2',
      surfaceCard: '#FFFFFF',
      surfaceSunken: '#EFECE6',
      textStrong: '#14120F',
      textBody: '#3A3631',
      textMuted: '#77716A',
      textInverse: '#F8F6F2',
      borderSubtle: '#E4E0D8',
      borderStrong: '#14120F',
      success: '#2F8F4E',
      warning: '#C98A12',
      danger: '#C8382B',
      info: '#2F6FB5',
      vertical: {
        food: '#C96A45', // Clay
        retail: '#4C9BD6', // Sky
        essentials: '#5E8C4A', // Bush
        parcels: '#E8B730', // Sun
        services: '#C9577E', // Protea
      },
    },
    font: { display: 'System', body: 'System', mono: 'monospace' },
  },
  orange: {
    name: 'Orange (current marketing site)',
    color: {
      brandPrimary: '#EA580C',
      onBrandPrimary: '#FFFFFF',
      brandPrimarySoft: '#FFF7ED',
      surfacePage: '#F9FAFB',
      surfaceCard: '#FFFFFF',
      surfaceSunken: '#F3F4F6',
      textStrong: '#111827',
      textBody: '#1F2937',
      textMuted: '#6B7280',
      textInverse: '#FFFFFF',
      borderSubtle: '#E5E7EB',
      borderStrong: '#111827',
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      info: '#2563EB',
      vertical: {
        food: '#C2410C',
        retail: '#2563EB',
        essentials: '#16A34A',
        parcels: '#D97706',
        services: '#DB2777',
      },
    },
    font: { display: 'System', body: 'System', mono: 'monospace' },
  },
} satisfies Record<string, Theme>

export type ThemeName = keyof typeof themes

/** ← Change this one line to restyle every app. */
export const ACTIVE_THEME: ThemeName = 'kolleka'

export const theme = { ...themes[ACTIVE_THEME], ...shared }
export type AppTheme = typeof theme

export const { space, radius, text, weight, touch } = shared

/** The same values as CSS variables, for the Next.js marketing site. */
export function themeToCssVars(t: Theme = themes[ACTIVE_THEME]): string {
  const c = t.color
  const lines = [
    `--brand-primary: ${c.brandPrimary};`,
    `--on-brand-primary: ${c.onBrandPrimary};`,
    `--brand-primary-soft: ${c.brandPrimarySoft};`,
    `--surface-page: ${c.surfacePage};`,
    `--surface-card: ${c.surfaceCard};`,
    `--text-strong: ${c.textStrong};`,
    `--text-body: ${c.textBody};`,
    `--text-muted: ${c.textMuted};`,
    `--border-subtle: ${c.borderSubtle};`,
    ...Object.entries(c.vertical).map(([k, v]) => `--vertical-${k}: ${v};`),
  ]
  return `:root {\n  ${lines.join('\n  ')}\n}\n`
}
