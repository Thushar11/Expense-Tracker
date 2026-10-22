const formatterCache = new Map();

function getFormatter(currency, compact) {
  const key = `${currency}|${compact}`;
  let f = formatterCache.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: compact ? 1 : 2,
        minimumFractionDigits: 0,
        ...(compact ? { notation: 'compact' } : {}),
      });
      formatterCache.set(key, f);
    } catch {
      return null;
    }
  }
  return f;
}

export function formatMoney(amount, currency, opts = {}) {
  const f = getFormatter(currency, !!opts.compact);
  const abs = Math.abs(amount);
  const body = f ? f.format(abs) : `${currency} ${abs.toFixed(2)}`;
  if (amount < 0) return `-${body}`;
  return opts.sign && amount > 0 ? `+${body}` : body;
}

export function currencySymbol(currency) {
  const f = getFormatter(currency, false);
  const part = f?.formatToParts(0).find((p) => p.type === 'currency');
  return part?.value ?? currency;
}

/** Parse user input like "1,234.50" into a number; NaN if invalid. */
export function parseAmount(text) {
  const cleaned = text.replace(/,/g, '').trim();
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === '' || cleaned === '.') return NaN;
  return Math.round(Number(cleaned) * 100) / 100;
}

export function percent(part, total) {
  return total > 0 ? (part / total) * 100 : 0;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
