import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native'
import { theme } from '@repo/tokens'
import { AppText } from './AppText'

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
  fullWidth?: boolean
  style?: ViewStyle
}

/** Big, easy-to-hit buttons (48px minimum) for phones. */
export function Button({ label, variant = 'primary', loading, disabled, fullWidth = true, style, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading
  const v = variantStyles[variant]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        v.container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.textColor} />
      ) : (
        <AppText variant="label" style={{ color: v.textColor, fontSize: theme.text.base, fontWeight: theme.weight.semibold }}>
          {label}
        </AppText>
      )}
    </Pressable>
  )
}

const variantStyles = {
  primary: {
    container: { backgroundColor: theme.color.brandPrimary, borderColor: theme.color.brandPrimary },
    textColor: theme.color.onBrandPrimary,
  },
  secondary: {
    container: { backgroundColor: theme.color.surfaceCard, borderColor: theme.color.borderStrong },
    textColor: theme.color.textStrong,
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderColor: 'transparent' },
    textColor: theme.color.textStrong,
  },
  danger: {
    container: { backgroundColor: theme.color.danger, borderColor: theme.color.danger },
    textColor: '#FFFFFF',
  },
} as const

const styles = StyleSheet.create({
  base: {
    minHeight: theme.touch,
    paddingHorizontal: theme.space[5],
    borderRadius: theme.radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
})
