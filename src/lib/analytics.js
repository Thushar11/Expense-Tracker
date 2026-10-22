import { addMonths, daysInMonth, toMonthKey } from './date';

export function totals(txs) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

export function inMonth(txs, monthKey) {
  return txs.filter((t) => t.date.startsWith(monthKey));
}

export function byCategory(txs, type, categoryById) {
  const map = new Map();
  for (const t of txs) {
    if (t.type !== type) continue;
    const category = categoryById.get(t.categoryId);
    if (!category) continue;
    const slice = map.get(category.id) ?? { category, amount: 0, count: 0 };
    slice.amount += t.amount;
    slice.count += 1;
    map.set(category.id, slice);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

/** Amount per day of the month, index 0 = day 1. */
export function dailyTotals(txs, monthKey, type) {
  const days = new Array(daysInMonth(monthKey)).fill(0);
  for (const t of txs) {
    if (t.type === type && t.date.startsWith(monthKey)) days[Number(t.date.slice(8, 10)) - 1] += t.amount;
  }
  return days;
}

/** Totals for the `count` months ending at `endMonth`, oldest first. */
export function monthlyTrend(txs, endMonth, count) {
  const months = Array.from({ length: count }, (_, i) => addMonths(endMonth, i - count + 1));
  const buckets = new Map(months.map((m) => [m, []]));
  for (const t of txs) buckets.get(toMonthKey(t.date))?.push(t);
  return months.map((month) => ({ month, ...totals(buckets.get(month)) }));
}

export function spentByCategory(txs, monthKey) {
  const map = new Map();
  for (const t of txs) {
    if (t.type === 'expense' && t.date.startsWith(monthKey))
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return map;
}
