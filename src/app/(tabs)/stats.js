import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BarChart, DonutChart, GroupedBarChart } from '../../components/Charts';
import { AppText, Card, EmptyState, IconCircle, MonthSwitcher, SectionHeader, SegmentedControl } from '../../components/ui';
import { spacing } from '../../constants/theme';
import { byCategory, dailyTotals, inMonth, monthlyTrend, totals } from '../../lib/analytics';
import { currentMonthKey, elapsedDaysInMonth, formatDate, monthShortName } from '../../lib/date';
import { formatMoney, percent } from '../../lib/format';
import { useAppTheme } from '../../lib/useAppTheme';
import { useStore } from '../../store/StoreProvider';

export default function StatsScreen() {
  const { colors, currency } = useAppTheme();
  const { transactions, categoryById } = useStore();
  const [month, setMonth] = useState(currentMonthKey());
  const [type, setType] = useState('expense');

  const monthTxs = useMemo(() => inMonth(transactions, month), [transactions, month]);
  const monthTotals = useMemo(() => totals(monthTxs), [monthTxs]);
  const slices = useMemo(() => byCategory(monthTxs, type, categoryById), [monthTxs, type, categoryById]);
  const daily = useMemo(() => dailyTotals(monthTxs, month, type), [monthTxs, month, type]);
  const trend = useMemo(() => monthlyTrend(transactions, month, 6), [transactions, month]);

  const total = type === 'expense' ? monthTotals.expense : monthTotals.income;
  const accent = type === 'expense' ? colors.expense : colors.income;
  const elapsed = elapsedDaysInMonth(month);
  const peakIdx = daily.reduce((best, v, i) => (v > daily[best] ? i : best), 0);
  const count = monthTxs.filter((t) => t.type === type).length;
  const largest = monthTxs.filter((t) => t.type === type).reduce((m, t) => (!m || t.amount > m.amount ? t : m), null);
  const savingsRate = monthTotals.income > 0 ? (monthTotals.balance / monthTotals.income) * 100 : 0;

  const labels = {};
  for (const d of [1, 8, 15, 22, daily.length]) labels[d - 1] = String(d);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <MonthSwitcher month={month} onChange={setMonth} />
      <View style={{ height: spacing.md }} />
      <SegmentedControl
        value={type}
        onChange={setType}
        options={[
          { value: 'expense', label: 'Expenses', color: colors.expense },
          { value: 'income', label: 'Income', color: colors.income },
        ]}
      />

      <Card style={{ marginTop: spacing.lg, alignItems: 'center' }}>
        {slices.length === 0 ? (
          <EmptyState
            icon="pie-chart-outline"
            title="No data"
            message={`No ${type === 'expense' ? 'expenses' : 'income'} recorded this month.`}
          />
        ) : (
          <>
            <DonutChart slices={slices.map((s) => ({ value: s.amount, color: s.category.color }))} size={210}>
              <AppText variant="caption" muted>
                Total {type === 'expense' ? 'spent' : 'earned'}
              </AppText>
              <AppText variant="heading" style={{ fontSize: 20 }}>
                {formatMoney(total, currency, { compact: total >= 1e6 })}
              </AppText>
            </DonutChart>
            <View style={styles.legend}>
              {slices.map((s) => (
                <View key={s.category.id} style={styles.legendRow}>
                  <IconCircle icon={s.category.icon} color={s.category.color} size={34} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">{s.category.name}</AppText>
                    <AppText variant="caption" muted>
                      {s.count} transaction{s.count === 1 ? '' : 's'}
                    </AppText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText variant="label">{formatMoney(s.amount, currency)}</AppText>
                    <AppText variant="caption" muted>
                      {percent(s.amount, total).toFixed(1)}%
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </Card>

      <SectionHeader title="Insights" />
      <View style={styles.grid}>
        <Insight label={`Avg / day`} value={formatMoney(elapsed ? total / elapsed : 0, currency, { compact: true })} />
        <Insight label="Transactions" value={String(count)} />
        <Insight
          label={type === 'expense' ? 'Biggest expense' : 'Biggest income'}
          value={largest ? formatMoney(largest.amount, currency, { compact: true }) : '—'}
          hint={largest ? formatDate(largest.date) : undefined}
        />
        <Insight
          label="Savings rate"
          value={monthTotals.income > 0 ? `${Math.round(savingsRate)}%` : '—'}
          color={savingsRate >= 0 ? colors.income : colors.expense}
        />
      </View>

      <SectionHeader title={`Daily ${type === 'expense' ? 'spending' : 'income'}`} />
      <Card>
        <BarChart data={daily} color={accent} labels={labels} highlightIndex={total > 0 ? peakIdx : undefined} />
        {total > 0 && (
          <AppText variant="caption" muted style={{ marginTop: spacing.sm }}>
            Peak day: {peakIdx + 1} {monthShortName(month)} · {formatMoney(daily[peakIdx], currency)}
          </AppText>
        )}
      </Card>

      <SectionHeader title="Last 6 months" />
      <Card>
        <GroupedBarChart
          groups={trend.map((t) => ({ label: monthShortName(t.month), income: t.income, expense: t.expense }))}
        />
        <View style={styles.trendLegend}>
          <LegendDot color={colors.income} label="Income" />
          <LegendDot color={colors.expense} label="Expenses" />
        </View>
      </Card>
    </ScrollView>
  );
}

function Insight({ label, value, hint, color }) {
  return (
    <Card style={styles.insight}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="heading" color={color} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      {hint ? (
        <AppText variant="caption" muted>
          {hint}
        </AppText>
      ) : null}
    </Card>
  );
}

function LegendDot({ color, label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <AppText variant="caption" muted>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  legend: { alignSelf: 'stretch', marginTop: spacing.xl, gap: spacing.md },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  insight: { flexBasis: '47%', flexGrow: 1, gap: 4 },
  trendLegend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginTop: spacing.md },
});
