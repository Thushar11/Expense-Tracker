import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';

import { TransactionRow } from '../../components/TransactionRow';
import { AppText, Chip, ChipRow, EmptyState, Fab, MonthSwitcher, SegmentedControl } from '../../components/ui';
import { radius, spacing } from '../../constants/theme';
import { totals } from '../../lib/analytics';
import { currentMonthKey, formatDayLabel } from '../../lib/date';
import { formatMoney } from '../../lib/format';
import { useAppTheme } from '../../lib/useAppTheme';
import { useStore } from '../../store/StoreProvider';

export default function TransactionsScreen() {
  const { colors, currency } = useAppTheme();
  const { transactions, categories, categoryById, deleteTransaction } = useStore();
  const [month, setMonth] = useState(currentMonthKey());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryId, setCategoryId] = useState(null);

  const searching = query.trim().length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      // A search looks across all months; otherwise show the selected month.
      if (!q && !t.date.startsWith(month)) return false;
      if (filter !== 'all' && t.type !== filter) return false;
      if (categoryId && t.categoryId !== categoryId) return false;
      if (q) {
        const cat = categoryById.get(t.categoryId)?.name.toLowerCase() ?? '';
        return t.note.toLowerCase().includes(q) || cat.includes(q) || String(t.amount).includes(q);
      }
      return true;
    });
  }, [transactions, month, filter, categoryId, query, categoryById]);

  const sections = useMemo(() => {
    const groups = new Map();
    for (const t of filtered) {
      const list = groups.get(t.date);
      if (list) list.push(t);
      else groups.set(t.date, [t]);
    }
    return [...groups.entries()].map(([date, data]) => ({ date, data, net: totals(data).balance }));
  }, [filtered]);

  const sum = useMemo(() => totals(filtered), [filtered]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => filter === 'all' || c.type === filter),
    [categories, filter],
  );

  const onPress = useCallback((tx) => router.push({ pathname: '/transaction', params: { id: tx.id } }), []);
  const onLongPress = useCallback(
    (tx) =>
      Alert.alert(
        'Delete transaction?',
        `${formatMoney(tx.amount, currency)} · ${categoryById.get(tx.categoryId)?.name ?? ''}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(tx.id) },
        ],
      ),
    [currency, categoryById, deleteTransaction],
  );

  const header = (
    <View style={{ gap: spacing.md, paddingBottom: spacing.sm }}>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search notes, categories, amounts"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searching ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {!searching && <MonthSwitcher month={month} onChange={setMonth} />}
      <SegmentedControl
        value={filter}
        onChange={(v) => {
          setFilter(v);
          setCategoryId(null);
        }}
        options={[
          { value: 'all', label: 'All' },
          { value: 'expense', label: 'Expenses', color: colors.expense },
          { value: 'income', label: 'Income', color: colors.income },
        ]}
      />
      <ChipRow>
        <Chip label="All categories" selected={!categoryId} onPress={() => setCategoryId(null)} />
        {visibleCategories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            icon={c.icon}
            color={c.color}
            selected={categoryId === c.id}
            onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
          />
        ))}
      </ChipRow>
      <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SummaryItem label="Income" value={formatMoney(sum.income, currency)} color={colors.income} />
        <SummaryItem label="Expenses" value={formatMoney(sum.expense, currency)} color={colors.expense} />
        <SummaryItem label="Net" value={formatMoney(sum.balance, currency)} color={colors.text} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader}>
            <AppText variant="label" muted>
              {formatDayLabel(section.date)}
            </AppText>
            <AppText variant="caption" muted>
              {formatMoney(section.net, currency, { sign: true })}
            </AppText>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.surface }]}>
            <TransactionRow
              tx={item}
              category={categoryById.get(item.categoryId)}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={searching ? 'search' : 'receipt-outline'}
            title={searching ? 'No matches' : 'Nothing here yet'}
            message={searching ? 'Try a different search term.' : 'Transactions for this month will appear here.'}
          />
        }
        ListFooterComponent={
          sections.length ? (
            <AppText variant="caption" muted style={{ textAlign: 'center', marginTop: spacing.lg }}>
              Tip: long-press a transaction to delete it
            </AppText>
          ) : undefined
        }
      />
      <Fab onPress={() => router.push('/transaction')} />
    </View>
  );
}

function SummaryItem({ label, value, color }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="label" color={color} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 110 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15 },
  summary: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  item: { paddingHorizontal: spacing.md, borderRadius: radius.md, marginBottom: 6 },
});
