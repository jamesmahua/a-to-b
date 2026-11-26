import type { ReactNode } from 'react'
import { AppText, Button, Notice, Sheet, Stack } from '@repo/ui'

interface ConfirmSheetProps {
  visible: boolean
  title: string
  confirmLabel: string
  busy: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
  children: ReactNode
}

/**
 * "Are you sure?" before a move that can't be undone from the driver app
 * (collected, delivered). One extra tap stops a pocket-tap from closing a job.
 */
export function ConfirmSheet({ visible, title, confirmLabel, busy, error, onConfirm, onClose, children }: ConfirmSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      footer={
        <Stack gap={3}>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Button label={confirmLabel} loading={busy} onPress={onConfirm} />
          <Button label="Not yet" variant="ghost" disabled={busy} onPress={onClose} />
        </Stack>
      }
    >
      {typeof children === 'string' ? <AppText>{children}</AppText> : children}
    </Sheet>
  )
}
