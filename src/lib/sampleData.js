import { toDateKey } from './date';

const EXPENSES = [
  // categoryId, min, max, note
  ['food', 120, 900, 'Lunch'],
  ['food', 200, 1500, 'Dinner out'],
  ['groceries', 400, 2500, 'Weekly groceries'],
  ['transport', 50, 600, 'Cab ride'],
  ['transport', 500, 2500, 'Fuel'],
  ['shopping', 600, 4000, 'Clothes'],
  ['bills', 800, 2500, 'Electricity bill'],
  ['bills', 399, 999, 'Mobile recharge'],
  ['entertainment', 199, 1200, 'Movie tickets'],
  ['health', 200, 2000, 'Pharmacy'],
  ['education', 499, 3000, 'Online course'],
];
const METHODS = ['upi', 'upi', 'card', 'cash', 'wallet'];

/** Generates ~3 months of realistic demo transactions ending today. */
export function generateSampleData() {
  const out = [];
  const today = new Date();
  let seed = 42;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  for (let m = 2; m >= 0; m--) {
    const first = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const last = m === 0 ? today.getDate() : new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const day = (d) => toDateKey(new Date(first.getFullYear(), first.getMonth(), d));

    out.push({
      type: 'income',
      amount: 65000,
      categoryId: 'salary',
      note: 'Monthly salary',
      date: day(1),
      paymentMethod: 'bank',
    });
    out.push({
      type: 'expense',
      amount: 18000,
      categoryId: 'housing',
      note: 'Rent',
      date: day(Math.min(3, last)),
      paymentMethod: 'bank',
    });
    if (rand() > 0.4) {
      out.push({
        type: 'income',
        amount: Math.round(5000 + rand() * 15000),
        categoryId: 'freelance',
        note: 'Client project',
        date: day(Math.max(1, Math.round(rand() * last))),
        paymentMethod: 'bank',
      });
    }
    for (let d = 1; d <= last; d++) {
      const n = Math.floor(rand() * 2.2);
      for (let i = 0; i < n; i++) {
        const [categoryId, min, max, note] = EXPENSES[Math.floor(rand() * EXPENSES.length)];
        out.push({
          type: 'expense',
          amount: Math.round(min + rand() * (max - min)),
          categoryId,
          note,
          date: day(d),
          paymentMethod: METHODS[Math.floor(rand() * METHODS.length)],
        });
      }
    }
  }
  return out;
}
