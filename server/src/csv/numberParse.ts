/**
 * Parses a number that may use either '.' or ',' as the decimal separator
 * (Hungarian exports commonly use ',' as decimal and '.' as thousands separator).
 */
export function parseLocaleNumber(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;

  s = s.replace(/\s/g, '');
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    s = s.replace(',', '.');
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
