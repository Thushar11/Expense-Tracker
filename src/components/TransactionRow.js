import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PAYMENT_METHODS } from '../constants/defaults';
import { formatDayLabel } from '../lib/date';
import { formatMoney } from '../lib/format';
import { useAppTheme } from '../lib/useAppTheme';
import { AppText, IconCircle } from './ui';

export const TransactionRow = memo(function TransactionRow({ tx, category, showDate, onPress, onLongPress }) {
  const { colors, currency } = useAppTheme();
  const method = PAYMENT_METHODS.find((p) => p.id === tx.paymentMethod)?.label;
  const subtitle = [showDate ? formatDayLabel(tx.date) : null, tx.note || null, method].filter(Boolean).join(' · ');
  const isIncome = tx.type === 'income';

  return (
    <Pressable
      onPress={() => onPress?.(tx)}
      onLongPress={() => onLongPress?.(tx)}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <IconCircle icon={category?.icon ?? 'help'} color={category?.color ?? colors.textMuted} size={42} />
      <View style={styles.body}>
        <AppText variant="label" numberOfLines={1}>
          {category?.name ?? 'Uncategorized'}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <AppText variant="label" color={isIncome ? colors.income : colors.text} style={{ fontSize: 15 }}>
        {isIncome ? '+' : '-'}
        {formatMoney(tx.amount, currency)}
      </AppText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  body: { flex: 1, gap: 2 },
});
