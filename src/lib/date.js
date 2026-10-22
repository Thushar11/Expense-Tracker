const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` in local time. */
export function toDateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** `YYYY-MM` for a date key or Date. */
export function toMonthKey(d) {
  return typeof d === 'string' ? d.slice(0, 7) : toDateKey(d).slice(0, 7);
}

export function currentMonthKey() {
  return toMonthKey(new Date());
}

export function addMonths(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number);
  return toMonthKey(new Date(y, m - 1 + delta, 1));
}

export function daysInMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function formatMonth(monthKey, short = false) {
  const [y, m] = monthKey.split('-').map(Number);
  return short ? `${MONTHS[m - 1]} ${String(y).slice(2)}` : `${MONTHS_LONG[m - 1]} ${y}`;
}

export function monthShortName(monthKey) {
  return MONTHS[Number(monthKey.slice(5, 7)) - 1];
}

export function formatDate(key) {
  const d = fromDateKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Today", "Yesterday" or "Mon, 21 Oct". */
export function formatDayLabel(key) {
  const today = new Date();
  if (key === toDateKey(today)) return 'Today';
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (key === toDateKey(yesterday)) return 'Yesterday';
  const d = fromDateKey(key);
  const label = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === today.getFullYear() ? label : `${label} ${d.getFullYear()}`;
}

/** Days elapsed in the given month (whole month if in the past). */
export function elapsedDaysInMonth(monthKey) {
  const now = currentMonthKey();
  if (monthKey < now) return daysInMonth(monthKey);
  if (monthKey > now) return 0;
  return new Date().getDate();
}

/** Date key for `daysAgo` days before today. */
export function relativeDateKey(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return toDateKey(d);
}
