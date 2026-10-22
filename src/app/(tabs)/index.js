import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TransactionRow } from '../../components/TransactionRow';
import { AppText, Card, EmptyState, Fab, IconCircle, ProgressBar, SectionHeader } from '../../components/ui';
import { OVERALL_BUDGET } from '../../constants/defaults';
import { radius, spacing } from '../../constants/theme';
import { byCategory, inMonth, totals } from '../../lib/analytics';
import { currentMonthKey, elapsedDaysInMonth, formatMonth } from '../../lib/date';
import { formatMoney, percent } from '../../lib/format';
import { useAppTheme } from '../../lib/useAppTheme';
import { useStore } from '../../store/StoreProvider';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, currency } = useAppTheme();
  const { transactions, categoryById, budgets } = useStore();
  const month = currentMonthKey();

  const all = useMemo(() => totals(transactions), [transactions]);
  const monthTxs = useMemo(() => inMonth(transactions, month), [transactions, month]);
  const monthTotals = useMemo(() => totals(monthTxs), [monthTxs]);
  const topCategories = useMemo(
    () => byCategory(monthTxs, 'expense', categoryById).slice(0, 4),
    [monthTxs, categoryById],
  );
  const recent = transactions.slice(0, 6);

  const budget = budgets[OVERALL_BUDGET];
  const budgetPct = budget ? percent(monthTotals.expense, budget) : 0;
  const avgDaily = monthTotals.expense / Math.max(1, elapsedDaysInMonth(month));

  const openTx = (tx) => router.push({ pathname: '/transaction', params: { id: tx.id } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.header}>
          <View>
            <AppText muted>{greeting()} 👋</AppText>
            <AppText variant="title">Your finances</AppText>
          </View>
          <IconCircle icon="wallet" color={colors.primary} size={44} />
        </View>

        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <AppText variant="caption" color="rgba(255,255,255,0.8)">
            TOTAL BALANCE
          </AppText>
          <AppText style={styles.balance} color="#fff" adjustsFontSizeToFit numberOfLines={1}>
            {formatMoney(all.balance, currency)}
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.8)">
            {formatMonth(month)}
          </AppText>
          <View style={styles.balanceRow}>
            <Stat icon="arrow-down" label="Income" value={formatMoney(monthTotals.income, currency)} />
            <View style={styles.divider} />
            <Stat icon="arrow-up" label="Expenses" value={formatMoney(monthTotals.expense, currency)} />
          </View>
        </View>

        {budget ? (
          <Card style={{ marginTop: spacing.lg }}>
            <View style={styles.rowBetween}>
              <AppText variant="label">Monthly budget</AppText>
              <AppText variant="caption" muted>
                {Math.round(budgetPct)}% used
              </AppText>
            </View>
            <View style={{ marginVertical: 10 }}>
              <ProgressBar
                value={budgetPct}
                color={budgetPct >= 100 ? colors.expense : budgetPct >= 80 ? colors.warning : colors.income}
              />
            </View>
            <AppText variant="caption" muted>
              {budget - monthTotals.expense >= 0
                ? `${formatMoney(budget - monthTotals.expense, currency)} left of ${formatMoney(budget, currency)}`
                : `Over budget by ${formatMoney(monthTotals.expense - budget, currency)}`}
            </AppText>
          </Card>
        ) : (
          <Card style={{ marginTop: spacing.lg }}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <AppText variant="label">Set a monthly budget</AppText>
                <AppText variant="caption" muted>
                  Stay on track with spending alerts.
                </AppText>
              </View>
              <AppText variant="label" color={colors.primary} onPress={() => router.push('/budgets')}>
                Set up
              </AppText>
            </View>
          </Card>
        )}

        <View style={styles.quickStats}>
          <Card style={styles.quickStat}>
            <AppText variant="caption" muted>
              Avg / day
            </AppText>
            <AppText variant="heading">{formatMoney(avgDaily, currency, { compact: true })}</AppText>
          </Card>
          <Card style={styles.quickStat}>
            <AppText variant="caption" muted>
              Saved this month
            </AppText>
            <AppText variant="heading" color={monthTotals.balance >= 0 ? colors.income : colors.expense}>
              {formatMoney(monthTotals.balance, currency, { compact: true })}
            </AppText>
          </Card>
        </View>

        {topCategories.length > 0 && (
          <>
            <SectionHeader title="Top spending" action="Details" onAction={() => router.push('/stats')} />
            <Card style={{ gap: 14 }}>
              {topCategories.map((s) => {
                const pct = percent(s.amount, monthTotals.expense);
                return (
                  <View key={s.category.id} style={{ gap: 6 }}>
                    <View style={styles.rowBetween}>
                      <View style={styles.inline}>
                        <Ionicons name={s.category.icon} size={16} color={s.category.color} />
                        <AppText variant="label">{s.category.name}</AppText>
                      </View>
                      <AppText variant="label">{formatMoney(s.amount, currency)}</AppText>
                    </View>
                    <ProgressBar value={pct} color={s.category.color} height={6} />
                  </View>
                );
              })}
            </Card>
          </>
        )}

        <SectionHeader
          title="Recent transactions"
          action={transactions.length ? 'See all' : undefined}
          onAction={() => router.push('/transactions')}
        />
        <Card style={{ paddingVertical: spacing.sm }}>
          {recent.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No transactions yet"
              message="Tap + to record your first expense or income."
            />
          ) : (
            recent.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                category={categoryById.get(tx.categoryId)}
                showDate
                onPress={openTx}
              />
            ))
          )}
        </Card>
      </ScrollView>
      <Fab onPress={() => router.push('/transaction')} />
    </View>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={14} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" color="rgba(255,255,255,0.8)">
          {label}
        </AppText>
        <AppText variant="label" color="#fff" numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  balanceCard: { borderRadius: radius.xl, padding: spacing.xl, gap: 4 },
  balance: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  balanceRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: spacing.md },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickStats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  quickStat: { flex: 1, gap: 4 },
});
