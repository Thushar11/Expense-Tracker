import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Chip, ChipRow, SegmentedControl, tap } from '../components/ui';
import { OTHER_EXPENSE_ID, OTHER_INCOME_ID, PAYMENT_METHODS } from '../constants/defaults';
import { radius, spacing } from '../constants/theme';
import { formatDate, fromDateKey, relativeDateKey, toDateKey } from '../lib/date';
import { currencySymbol, parseAmount } from '../lib/format';
import { useAppTheme } from '../lib/useAppTheme';
import { useStore } from '../store/StoreProvider';

export default function TransactionScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors, currency } = useAppTheme();
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction } = useStore();
  const existing = useMemo(() => transactions.find((t) => t.id === id), [transactions, id]);

  const [type, setType] = useState(existing?.type ?? 'expense');
  const [amountText, setAmountText] = useState(existing ? String(existing.amount) : '');
  const [selectedCategoryId, setCategoryId] = useState(existing?.categoryId ?? null);
  const [date, setDate] = useState(existing?.date ?? toDateKey(new Date()));
  const [paymentMethod, setPaymentMethod] = useState(existing?.paymentMethod ?? 'upi');
  const [note, setNote] = useState(existing?.note ?? '');

  const typeCategories = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  // Ignore a selection that doesn't belong to the chosen type (e.g. after switching expense/income).
  const categoryId = typeCategories.some((c) => c.id === selectedCategoryId) ? selectedCategoryId : null;

  const amount = parseAmount(amountText);
  const amountValid = !Number.isNaN(amount) && amount > 0;
  const accent = type === 'expense' ? colors.expense : colors.income;

  const save = () => {
    if (!amountValid) {
      Alert.alert('Enter an amount', 'The amount must be greater than zero.');
      return;
    }
    const data = {
      type,
      amount,
      categoryId: categoryId ?? (type === 'expense' ? OTHER_EXPENSE_ID : OTHER_INCOME_ID),
      date,
      paymentMethod,
      note: note.trim(),
    };
    if (existing) updateTransaction({ ...existing, ...data });
    else addTransaction(data);
    tap();
    router.back();
  };

  const remove = () =>
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (existing) deleteTransaction(existing.id);
          router.back();
        },
      },
    ]);

  const openAndroidPicker = () =>
    DateTimePickerAndroid.open({
      value: fromDateKey(date),
      mode: 'date',
      maximumDate: new Date(),
      onChange: (event, d) => {
        if (event.type === 'set' && d) setDate(toDateKey(d));
      },
    });

  if (id && !existing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <AppText muted>This transaction no longer exists.</AppText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <Stack.Screen
        options={{
          title: existing ? 'Edit transaction' : 'New transaction',
          headerRight: existing
            ? () => (
                <Pressable onPress={remove} hitSlop={10} accessibilityLabel="Delete transaction">
                  <Ionicons name="trash-outline" size={22} color={colors.expense} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SegmentedControl
          value={type}
          onChange={setType}
          options={[
            { value: 'expense', label: 'Expense', color: colors.expense },
            { value: 'income', label: 'Income', color: colors.income },
          ]}
        />

        <View style={styles.amountWrap}>
          <AppText style={[styles.currency, { color: accent }]}>{currencySymbol(currency)}</AppText>
          <TextInput
            value={amountText}
            onChangeText={(t) => setAmountText(t.replace(/[^0-9.,]/g, ''))}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            autoFocus={!existing}
            style={[styles.amountInput, { color: accent }]}
            accessibilityLabel="Amount"
          />
        </View>

        <AppText variant="label" muted style={styles.label}>
          Category
        </AppText>
        <View style={styles.grid}>
          {typeCategories.map((c) => {
            const selected = c.id === categoryId;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  tap();
                  setCategoryId(c.id);
                }}
                style={styles.gridItem}
              >
                <View
                  style={[
                    styles.catIcon,
                    {
                      backgroundColor: selected ? c.color : c.color + '22',
                      borderColor: selected ? c.color : 'transparent',
                    },
                  ]}
                >
                  <Ionicons name={c.icon} size={22} color={selected ? '#fff' : c.color} />
                </View>
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  style={{ textAlign: 'center', fontWeight: selected ? '700' : '400' }}
                >
                  {c.name}
                </AppText>
              </Pressable>
            );
          })}
          <Pressable onPress={() => router.push('/categories')} style={styles.gridItem}>
            <View style={[styles.catIcon, { borderColor: colors.border, borderStyle: 'dashed' }]}>
              <Ionicons name="add" size={22} color={colors.textMuted} />
            </View>
            <AppText variant="caption" muted style={{ textAlign: 'center' }}>
              New
            </AppText>
          </Pressable>
        </View>

        <AppText variant="label" muted style={styles.label}>
          Date
        </AppText>
        <View style={styles.dateRow}>
          <Chip label="Today" selected={date === relativeDateKey(0)} onPress={() => setDate(relativeDateKey(0))} />
          <Chip label="Yesterday" selected={date === relativeDateKey(1)} onPress={() => setDate(relativeDateKey(1))} />
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={fromDateKey(date)}
              mode="date"
              display="compact"
              maximumDate={new Date()}
              onChange={(_, d) => d && setDate(toDateKey(d))}
              accentColor={colors.primary}
            />
          ) : (
            <Pressable
              onPress={openAndroidPicker}
              style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <AppText variant="label" style={{ fontSize: 13 }}>
                {formatDate(date)}
              </AppText>
            </Pressable>
          )}
        </View>

        <AppText variant="label" muted style={styles.label}>
          Payment method
        </AppText>
        <ChipRow>
          {PAYMENT_METHODS.map((p) => (
            <Chip
              key={p.id}
              label={p.label}
              icon={p.icon}
              selected={paymentMethod === p.id}
              onPress={() => setPaymentMethod(p.id)}
            />
          ))}
        </ChipRow>

        <AppText variant="label" muted style={styles.label}>
          Note
        </AppText>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What was this for?"
          placeholderTextColor={colors.textMuted}
          style={[styles.note, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
          maxLength={120}
          returnKeyType="done"
        />
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.md,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Button
          title={existing ? 'Save changes' : `Add ${type}`}
          icon="checkmark"
          onPress={save}
          disabled={!amountValid}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  amountWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xl },
  currency: { fontSize: 34, fontWeight: '700', marginRight: 6 },
  amountInput: { fontSize: 48, fontWeight: '800', minWidth: 80, textAlign: 'center', padding: 0 },
  label: { marginTop: spacing.lg, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  gridItem: { width: '25%', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  catIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  note: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.md, fontSize: 15 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
