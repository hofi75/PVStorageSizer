/** Formats a date as YYYY.MM.DD - fixed regardless of the UI language. */
export function formatDateYMD(date: Date | number | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
