import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

/** Offered in the UI when the file has a single combined timestamp column. */
export const DATETIME_FORMATS = [
  'ISO',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm',
  'YYYY.MM.DD HH:mm:ss',
  'YYYY.MM.DD HH:mm',
  'YYYY.MM.DD. HH:mm',
  'DD.MM.YYYY HH:mm:ss',
  'DD.MM.YYYY HH:mm',
  'DD/MM/YYYY HH:mm',
  'MM/DD/YYYY HH:mm',
] as const;

/** Offered in the UI when date and time are in separate columns. */
export const DATE_ONLY_FORMATS = [
  'YYYY-MM-DD',
  'YYYY.MM.DD',
  'YYYY.MM.DD.',
  'DD.MM.YYYY',
  'DD/MM/YYYY',
  'MM/DD/YYYY',
] as const;

/** Removes all whitespace so e.g. "2026. 01. 01." and "2026.01.01." both match format "YYYY.MM.DD." */
function stripSpaces(s: string): string {
  return s.replace(/\s+/g, '');
}

/** Parses a combined date+time string. Returns epoch ms, or null if invalid. */
export function parseTimestamp(raw: string, format: string): number | null {
  const s = raw.trim();
  if (!s) return null;

  if (format === 'ISO') {
    const d = dayjs(s);
    return d.isValid() ? d.valueOf() : null;
  }

  const d = dayjs(stripSpaces(s), stripSpaces(format), true);
  return d.isValid() ? d.valueOf() : null;
}

/** Parses a date-only string against one of DATE_ONLY_FORMATS. */
export function parseDateOnly(raw: string, format: string): { year: number; month: number; day: number } | null {
  const s = raw.trim();
  if (!s) return null;
  const d = dayjs(stripSpaces(s), stripSpaces(format), true);
  if (!d.isValid()) return null;
  return { year: d.year(), month: d.month(), day: d.date() };
}

/** Parses a time-only string like "HH:mm" or "HH:mm:ss". */
export function parseTimeOnly(raw: string): { hour: number; minute: number; second: number } | null {
  const s = raw.trim();
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  const second = m[3] ? Number(m[3]) : 0;
  if (hour > 23 || minute > 59 || second > 59) return null;
  return { hour, minute, second };
}

/** Combines a date-only and time-only string into epoch ms using local time. */
export function combineDateAndTime(dateStr: string, dateFormat: string, timeStr: string): number | null {
  const date = parseDateOnly(dateStr, dateFormat);
  if (!date) return null;
  const time = parseTimeOnly(timeStr);
  if (!time) return null;
  return new Date(date.year, date.month, date.day, time.hour, time.minute, time.second, 0).getTime();
}
