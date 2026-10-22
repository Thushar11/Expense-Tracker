import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { radius, spacing } from '../constants/theme';
import { currencySymbol, parseAmount } from '../lib/format';
import { useAppTheme } from '../lib/useAppTheme';
import { AppText, Button } from './ui';

/** Small modal that asks for a single money amount (used for budgets). */
export function AmountPrompt({ visible, ...rest }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={rest.onClose}>
      {/* Body mounts fresh on each open so its input starts from `initial`. */}
      {visible ? <PromptBody {...rest} /> : null}
    </Modal>
  );
}

function PromptBody({ title, subtitle, initial, onSubmit, onRemove, onClose }) {
  const { colors, currency } = useAppTheme();
  const [text, setText] = useState(initial ? String(initial) : '');

  const amount = parseAmount(text);
  const valid = !Number.isNaN(amount) && amount > 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <AppText variant="heading">{title}</AppText>
          {subtitle ? <AppText muted>{subtitle}</AppText> : null}
          <View style={[styles.inputWrap, { backgroundColor: colors.surfaceAlt }]}>
            <AppText variant="heading" muted>
              {currencySymbol(currency)}
            </AppText>
            <TextInput
              value={text}
              onChangeText={setText}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              autoFocus
              style={[styles.input, { color: colors.text }]}
              onSubmitEditing={() => valid && onSubmit(amount)}
            />
          </View>
          <View style={styles.actions}>
            {onRemove ? <Button title="Remove" kind="danger" onPress={onRemove} style={styles.flex} /> : null}
            <Button title="Cancel" kind="secondary" onPress={onClose} style={styles.flex} />
            <Button title="Save" onPress={() => onSubmit(amount)} disabled={!valid} style={styles.flex} />
          </View>
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  sheet: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  input: { flex: 1, fontSize: 24, fontWeight: '700', paddingVertical: 12 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
