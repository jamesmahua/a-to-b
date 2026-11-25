import { Text, type TextProps, type TextStyle } from 'react-native'
import { theme } from '@repo/tokens'

type Variant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'label' | 'code'

const variants: Record<Variant, TextStyle> = {
  display: { fontSize: theme.text['3xl'], fontWeight: theme.weight.bold, color: theme.color.textStrong },
  title: { fontSize: theme.text['2xl'], fontWeight: theme.weight.bold, color: theme.color.textStrong },
  heading: { fontSize: theme.text.lg, fontWeight: theme.weight.semibold, color: theme.color.textStrong },
  body: { fontSize: theme.text.base, color: theme.color.textBody, lineHeight: 22 },
  small: { fontSize: theme.text.sm, color: theme.color.textMuted, lineHeight: 20 },
  label: { fontSize: theme.text.sm, fontWeight: theme.weight.medium, color: theme.color.textBody },
  /** Order codes and PINs: KK-4821 */
  code: { fontSize: theme.text.lg, fontFamily: theme.font.mono, color: theme.color.textStrong, letterSpacing: 1 },
}

export interface AppTextProps extends TextProps {
  variant?: Variant
  tone?: 'default' | 'muted' | 'danger' | 'success' | 'inverse'
  center?: boolean
}

const tones = {
  default: undefined,
  muted: theme.color.textMuted,
  danger: theme.color.danger,
  success: theme.color.success,
  inverse: theme.color.textInverse,
}

/** All text in the apps goes through this, so fonts and colours come from the theme. */
export function AppText({ variant = 'body', tone = 'default', center, style, ...rest }: AppTextProps) {
  return (
    <Text
      style={[variants[variant], tones[tone] ? { color: tones[tone] } : null, center ? { textAlign: 'center' } : null, style]}
      {...rest}
    />
  )
}
