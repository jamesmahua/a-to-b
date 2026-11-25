import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native'
import { theme } from '@repo/tokens'
import { AppText } from './AppText'

/**
 * Page wrapper. Scrolls, keeps a readable width on big screens (browser),
 * and fills the phone screen on mobile.
 */
export function Screen({ children, centered, maxWidth = 560 }: { children: ReactNode; centered?: boolean; maxWidth?: number }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, centered && styles.centered]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.inner, { maxWidth }]}>{children}</View>
    </ScrollView>
  )
}

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />
}

export function Stack({ gap = 4, style, ...rest }: ViewProps & { gap?: keyof typeof theme.space }) {
  return <View style={[{ gap: theme.space[gap] }, style as ViewStyle]} {...rest} />
}

/** Small switch for yes/no choices like accepting terms. */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.checkRow}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <AppText style={{ color: theme.color.onBrandPrimary, fontWeight: '700' }}>✓</AppText> : null}
      </View>
      <View style={{ flex: 1 }}>{typeof label === 'string' ? <AppText variant="small">{label}</AppText> : label}</View>
    </Pressable>
  )
}

/** Friendly coloured message box for errors and notices. */
export function Notice({ tone = 'info', children }: { tone?: 'info' | 'danger' | 'success'; children: ReactNode }) {
  const color = { info: theme.color.info, danger: theme.color.danger, success: theme.color.success }[tone]
  return (
    <View style={[styles.notice, { borderColor: color }]}>
      <AppText variant="small" style={{ color }}>
        {children}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.surfacePage },
  content: { flexGrow: 1, padding: theme.space[5], alignItems: 'center' },
  centered: { justifyContent: 'center' },
  inner: { width: '100%', gap: theme.space[5] },
  card: {
    backgroundColor: theme.color.surfaceCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.borderSubtle,
    padding: theme.space[5],
    gap: theme.space[4],
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space[3], minHeight: 32 },
  box: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    borderColor: theme.color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: theme.color.brandPrimary },
  notice: { borderWidth: 1, borderRadius: theme.radius.md, padding: theme.space[3] },
})
