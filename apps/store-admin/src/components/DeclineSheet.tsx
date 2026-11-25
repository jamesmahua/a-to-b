import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { REJECT_REASONS, REJECT_REASON_LABELS, type RejectReason } from '@repo/types'
import { AppText, Button, Sheet, theme } from '@repo/ui'

export interface DeclineSheetProps {
  /** The order being declined, e.g. "KK-4821". `null` keeps the sheet closed. */
  orderCode: string | null
  onClose: () => void
  onConfirm: (reason: RejectReason) => Promise<void>
}

/**
 * "Why are you declining?" Tap a reason, then confirm. No typing, so it's quick
 * on a phone in a busy shop. The reasons come from @repo/types, the same list
 * the security rules accept.
 */
export function DeclineSheet({ orderCode, onClose, onConfirm }: DeclineSheetProps) {
  const [reason, setReason] = useState<RejectReason | null>(null)
  const [busy, setBusy] = useState(false)

  // Start fresh each time the sheet opens for an order.
  useEffect(() => {
    setReason(null)
    setBusy(false)
  }, [orderCode])

  const confirm = async () => {
    if (!reason) return
    setBusy(true)
    try {
      await onConfirm(reason)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      visible={orderCode !== null}
      onClose={onClose}
      title={`Decline ${orderCode ?? ''}?`}
      footer={
        <Button
          label="Decline order"
          variant="danger"
          disabled={!reason}
          loading={busy}
          onPress={confirm}
        />
      }
    >
      <AppText>Choose a reason. The customer will see that you couldn’t take this order.</AppText>
      <View style={{ gap: theme.space[2] }} accessibilityRole="radiogroup">
        {REJECT_REASONS.map((r) => {
          const selected = r === reason
          return (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setReason(r)}
              style={({ pressed }) => [styles.option, selected && styles.selected, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.dot, selected && styles.dotSelected]} />
              <AppText variant="label" style={{ fontSize: theme.text.base }}>
                {REJECT_REASON_LABELS[r]}
              </AppText>
            </Pressable>
          )
        })}
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    minHeight: theme.touch,
    paddingHorizontal: theme.space[4],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.borderSubtle,
    backgroundColor: theme.color.surfaceCard,
  },
  selected: { borderColor: theme.color.textStrong, borderWidth: 2 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.color.borderStrong },
  dotSelected: { borderWidth: 6, borderColor: theme.color.textStrong },
})
