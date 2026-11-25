import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { theme } from '@repo/tokens'
import { AppText } from './AppText'

export interface SheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Pinned under the scrolling content, e.g. an "Add to cart" button. */
  footer?: ReactNode
}

/**
 * Bottom sheet: slides up over the current screen. Tapping the dark backdrop
 * or "Close" dismisses it. On a wide browser window it stays phone-width.
 *
 * Built on React Native's `Modal`, which react-native-web also supports, so it
 * works the same on Android, iOS and in the browser.
 */
export function Sheet({ visible, onClose, title, children, footer }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={styles.panel} accessibilityViewIsModal>
          <View style={styles.header}>
            <AppText variant="heading" style={{ flex: 1 }}>
              {title ?? ''}
            </AppText>
            <Pressable onPress={onClose} accessibilityRole="button" style={styles.close}>
              <AppText variant="label">Close</AppText>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(20, 18, 15, 0.45)' },
  panel: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '85%',
    backgroundColor: theme.color.surfacePage,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space[5],
    paddingTop: theme.space[4],
    paddingBottom: theme.space[2],
  },
  close: { minHeight: theme.touch, justifyContent: 'center', paddingHorizontal: theme.space[2] },
  content: { paddingHorizontal: theme.space[5], paddingBottom: theme.space[5], gap: theme.space[4] },
  footer: {
    padding: theme.space[5],
    borderTopWidth: 1,
    borderTopColor: theme.color.borderSubtle,
    backgroundColor: theme.color.surfaceCard,
  },
})
