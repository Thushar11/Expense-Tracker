import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AmountPrompt } from '../../components/AmountPrompt';
import { AppText, Card, IconCircle, MonthSwitcher, ProgressBar, SectionHeader } from '../../components/ui';
import { OVERALL_BUDGET } from '../../constants/defaults';
import { spacing } from '../../constants/theme';
import { spentByCategory } from '../../lib/analytics';
import { currentMonthKey, daysInMonth, elapsedDaysInMonth } from '../../lib/date';
import { formatMoney, percent } from '../../lib/format';
import { useAppTheme } from '../../lib/useAppTheme';
import { useStore } from '../../store/StoreProvider';

export default function BudgetsScreen() {
  const { colors, currency } = useAppTheme();
  const { transactions, categories, budgets, setBudget } = useStore();
  const [month, setMonth] = useState(currentMonthKey());
  const [editing, setEditing] = useState(null);

  const spent = useMemo(() => spentByCategory(transactions, month), [transactions, month]);
  const totalSpent = useMemo(() => [...spent.values()].reduce((a, b) => a + b, 0), [spent]);
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const withBudget = expenseCategories.filter((c) => budgets[c.id]);
  const withoutBudget = expenseCategories.filter((c) => !budgets[c.id]);

  const overall = budgets[OVERALL_BUDGET];
  const overallPct = overall ? percent(totalSpent, overall) : 0;
  const daysLeft = daysInMonth(month) - elapsedDaysInMonth(month);
  const isCurrent = month === currentMonthKey();

  const statusColor = (pct) => (pct >= 100 ? colors.expense : pct >= 80 ? colors.warning : colors.income);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <MonthSwitcher month={month} onChange={setMonth} />

        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.rowBetween}>
            <AppText variant="heading">Monthly budget</AppText>
            <Pressable onPress={() => setEditing({ key: OVERALL_BUDGET, title: 'Monthly budget' })} hitSlop={10}>
              <AppText variant="label" color={colors.primary}>
                {overall ? 'Edit' : 'Set'}
              </AppText>
            </Pressable>
          </View>
          {overall ? (
            <View style={{ gap: 10, marginTop: spacing.md }}>
              <View style={styles.rowBetween}>
                <AppText style={{ fontSize: 24, fontWeight: '800' }}>{formatMoney(totalSpent, currency)}</AppText>
                <AppText muted>of {formatMoney(overall, currency)}</AppText>
              </View>
              <ProgressBar value={overallPct} color={statusColor(overallPct)} height={10} />
              <View style={styles.rowBetween}>
                <AppText variant="caption" color={statusColor(overallPct)}>
                  {overall >= totalSpent
                    ? `${formatMoney(overall - totalSpent, currency)} remaining`
                    : `${formatMoney(totalSpent - overall, currency)} over budget`}
                </AppText>
                {isCurrent && daysLeft > 0 && overall > totalSpent ? (
                  <AppText variant="caption" muted>
                    {formatMoney((overall - totalSpent) / daysLeft, currency)}/day for {daysLeft} days
                  </AppText>
                ) : null}
              </View>
            </View>
          ) : (
            <AppText muted style={{ marginTop: spacing.sm }}>
              {`Set a total spending limit for each month. You've spent ${formatMoney(totalSpent, currency)} so far.`}
            </AppText>
          )}
        </Card>

        {overallPct >= 80 && overall ? (
          <View
            style={[styles.alert, { backgroundColor: overallPct >= 100 ? colors.expenseSoft : colors.warning + '22' }]}
          >
            <Ionicons name="warning" size={18} color={overallPct >= 100 ? colors.expense : colors.warning} />
            <AppText variant="label" color={overallPct >= 100 ? colors.expense : colors.warning} style={{ flex: 1 }}>
              {overallPct >= 100
                ? "You've exceeded your monthly budget."
                : "You've used over 80% of your monthly budget."}
            </AppText>
          </View>
        ) : null}

        <SectionHeader title="Category budgets" />
        {withBudget.length === 0 ? (
          <AppText muted style={{ marginBottom: spacing.md }}>
            No category budgets yet. Pick a category below to set one.
          </AppText>
        ) : (
          <View style={{ gap: spacing.md }}>
            {withBudget.map((c) => {
              const s = spent.get(c.id) ?? 0;
              const limit = budgets[c.id];
              const pct = percent(s, limit);
              return (
                <Pressable key={c.id} onPress={() => setEditing({ key: c.id, title: `${c.name} budget` })}>
                  <Card style={{ gap: 10 }}>
                    <View style={styles.rowBetween}>
                      <View style={styles.inline}>
                        <IconCircle icon={c.icon} color={c.color} size={36} />
                        <View>
                          <AppText variant="label">{c.name}</AppText>
                          <AppText variant="caption" muted>
                            {formatMoney(s, currency)} of {formatMoney(limit, currency)}
                          </AppText>
                        </View>
                      </View>
                      <AppText variant="label" color={statusColor(pct)}>
                        {Math.round(pct)}%
                      </AppText>
                    </View>
                    <ProgressBar value={pct} color={statusColor(pct)} />
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}

        {withoutBudget.length > 0 && (
          <>
            <SectionHeader title="Add a category budget" />
            <Card style={{ paddingVertical: spacing.sm }}>
              {withoutBudget.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setEditing({ key: c.id, title: `${c.name} budget` })}
                  style={({ pressed }) => [styles.addRow, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <IconCircle icon={c.icon} color={c.color} size={34} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">{c.name}</AppText>
                    <AppText variant="caption" muted>
                      Spent {formatMoney(spent.get(c.id) ?? 0, currency)}
                    </AppText>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                </Pressable>
              ))}
            </Card>
          </>
        )}
      </ScrollView>

      <AmountPrompt
        visible={!!editing}
        title={editing?.title ?? ''}
        subtitle="Applies to every month."
        initial={editing ? budgets[editing.key] : undefined}
        onClose={() => setEditing(null)}
        onSubmit={(amount) => {
          if (editing) setBudget(editing.key, amount);
          setEditing(null);
        }}
        onRemove={
          editing && budgets[editing.key]
            ? () => {
                setBudget(editing.key, null);
                setEditing(null);
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10 },
});
