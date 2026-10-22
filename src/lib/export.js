import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { PAYMENT_METHODS } from '../constants/defaults';

function csvCell(value) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function transactionsToCsv(txs, categoryById, currency) {
  const header = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Payment Method', 'Note'];
  const rows = txs.map((t) => [
    t.date,
    t.type,
    categoryById.get(t.categoryId)?.name ?? 'Unknown',
    t.amount.toFixed(2),
    currency,
    PAYMENT_METHODS.find((p) => p.id === t.paymentMethod)?.label ?? t.paymentMethod,
    t.note,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

/** Writes the CSV to the cache directory and opens the system share sheet. */
export async function shareCsv(csv) {
  const file = new File(Paths.cache, `expenses-${Date.now()}.csv`);
  file.create({ overwrite: true });
  file.writeSync(csv);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export transactions',
    UTI: 'public.comma-separated-values-text',
  });
}
