import { useState } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { theme } from '@repo/tokens'
import { AppText } from './AppText'

export interface TextFieldProps extends TextInputProps {
  label: string
  error?: string | null
  hint?: string
}

export function TextField({ label, error, hint, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.color.textMuted}
        style={[
          styles.input,
          focused && { borderColor: theme.color.borderStrong },
          !!error && { borderColor: theme.color.danger },
          style,
        ]}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        {...rest}
      />
      {error ? (
        <AppText variant="small" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small">{hint}</AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: theme.space[1], alignSelf: 'stretch' },
  input: {
    minHeight: theme.touch,
    paddingHorizontal: theme.space[4],
    borderWidth: 2,
    borderColor: theme.color.borderSubtle,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfaceCard,
    fontSize: theme.text.base,
    color: theme.color.textStrong,
  },
})
