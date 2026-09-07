import { DATE_ONLY_FORMATS, DATETIME_FORMATS, parseDateOnly, parseTimeOnly, parseTimestamp } from './dateFormats.js';
import { parseLocaleNumber } from './numberParse.js';
import type { ColumnMapping } from '../simulation/types.js';

const SAMPLE_SIZE = 40;
const CONFIDENCE_THRESHOLD = 0.6;
/** Small bonus so a matching header only breaks ties/near-ties, it never overrides a clearly better data match. */
const HEADER_HINT_BONUS = 0.15;

const DATE_HEADER_HINTS = [
  'dátum', 'datum', 'időpont', 'idopont', 'időbélyeg', 'idobelyeg', 'timestamp', 'date', 'datetime',
];
const TIME_ONLY_HEADER_HINTS = ['idő', 'ido', 'time', 'óra', 'ora'];
const VALUE_HEADER_HINTS = [
  'érték', 'ertek', 'fogyasztás', 'fogyasztas', 'termelés', 'termeles', 'energia', 'energy', 'value',
  'production', 'consumption', 'power', 'teljesítmény', 'teljesitmeny', 'mennyiség', 'mennyiseg', 'kwh', 'kw', 'wh',
];
const START_HEADER_HINTS = ['kezdet', 'start'];
/** Marks a row as an import/consumption reading in files that log multiple reading
 *  types per timestamp (e.g. a meter export with both "Vételezett" and "Visszatáplált"
 *  rows) - used to default the row filter so those types don't collide during dedup. */
const CONSUMPTION_TYPE_HINTS = ['vétel', 'vetel', 'fogyas', 'import', 'consumption', 'terhelés', 'terheles', 'load'];
/** Marks a row as a grid-backfeed/export reading, in the same kind of file as above. */
const GRID_BACKFEED_HINTS = ['visszatáp', 'visszatap', 'betáp', 'betap', 'export', 'einspeis', 'feed'];
const MAX_TYPE_COLUMN_DISTINCT_VALUES = 8;

function includesAny(text: string, hints: string[]): boolean {
  return hints.some((h) => text.includes(h));
}

function headerOf(rows: string[][], hasHeader: boolean, col: number): string {
  return hasHeader ? (rows[0]?.[col] ?? '').toLowerCase() : '';
}

function sampleValues(dataRows: string[][], col: number): string[] {
  const out: string[] = [];
  for (const row of dataRows) {
    const v = row[col];
    if (v && v.trim()) out.push(v.trim());
    if (out.length >= SAMPLE_SIZE) break;
  }
  return out;
}

function matchRate<T>(values: string[], parse: (v: string) => T | null): number {
  if (values.length === 0) return 0;
  return values.filter((v) => parse(v) !== null).length / values.length;
}

function bestFormat(
  values: string[],
  formats: readonly string[],
  parse: (v: string, format: string) => unknown,
): { format: string; rate: number } {
  let best = { format: formats[0], rate: 0 };
  for (const format of formats) {
    const rate = matchRate(values, (v) => parse(v, format));
    if (rate > best.rate) best = { format, rate };
  }
  return best;
}

/**
 * dayjs's 'ISO' mode falls back to the native Date parser for non-ISO-8601 strings,
 * which lenient-parses bare dates (no time part) as midnight - e.g. "2024.01.01."
 * would otherwise look like a full timestamp match and outscore the correct
 * date-only column. Require an actual time component for the 'ISO' format specifically.
 */
function parseDatetimeForDetection(raw: string, format: string): number | null {
  if (format === 'ISO' && !raw.includes(':')) return null;
  return parseTimestamp(raw, format);
}

function pickBest<T extends { col: number }>(items: T[], score: (item: T) => number): (T & { score: number }) | null {
  let best: (T & { score: number }) | null = null;
  for (const item of items) {
    const s = score(item);
    if (!best || s > best.score) best = { ...item, score: s };
  }
  return best;
}

/**
 * Looks for a small-cardinality categorical column (e.g. "Vételezett"/"Visszatáplált")
 * whose values mark what kind of reading each row is. Files shaped like this record
 * multiple reading types per timestamp; without filtering to one type, rows for
 * different types but the same timestamp collide during dedup and silently overwrite
 * each other. Scans the full column (not just the head sample) since such files often
 * group all rows of one type before the other.
 */
function detectTypeFilterColumn(
  dataRows: string[][],
  columnCount: number,
  excludeCols: Set<number>,
): { col: number; value: string; backfeedValue: string | null } | null {
  for (let col = 0; col < columnCount; col++) {
    if (excludeCols.has(col)) continue;
    const distinct = new Set<string>();
    let consumptionMatch: string | null = null;
    let backfeedMatch: string | null = null;
    let tooManyDistinctValues = false;
    for (const row of dataRows) {
      const v = row[col]?.trim();
      if (!v) continue;
      distinct.add(v);
      if (distinct.size > MAX_TYPE_COLUMN_DISTINCT_VALUES) {
        tooManyDistinctValues = true;
        break;
      }
      const lower = v.toLowerCase();
      if (!consumptionMatch && includesAny(lower, CONSUMPTION_TYPE_HINTS)) consumptionMatch = v;
      if (!backfeedMatch && includesAny(lower, GRID_BACKFEED_HINTS)) backfeedMatch = v;
    }
    if (!tooManyDistinctValues && distinct.size >= 2 && consumptionMatch) {
      return { col, value: consumptionMatch, backfeedValue: backfeedMatch };
    }
  }
  return null;
}

/**
 * Guesses a sensible column mapping from the raw CSV rows: which column is the
 * timestamp (single combined column, or split date+time) and in which format, and
 * which column holds the value to import. Column headers (when present) mainly break
 * ties between columns that fit the data almost equally well; the data itself decides
 * the date/number format.
 */
export function inferMapping(rows: string[][], suggestedHeader: boolean, columnCount: number): ColumnMapping {
  const hasHeader = suggestedHeader;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const columns = Array.from({ length: columnCount }, (_, i) => i);

  const perColumn = columns.map((col) => {
    const values = sampleValues(dataRows, col);
    const header = headerOf(rows, hasHeader, col);
    const datetime = bestFormat(values, DATETIME_FORMATS, parseDatetimeForDetection);
    const dateOnly = bestFormat(values, DATE_ONLY_FORMATS, parseDateOnly);
    return {
      col,
      header,
      isDateHeader: includesAny(header, DATE_HEADER_HINTS),
      isTimeHeader: includesAny(header, TIME_ONLY_HEADER_HINTS) && !includesAny(header, DATE_HEADER_HINTS),
      isValueHeader: includesAny(header, VALUE_HEADER_HINTS),
      datetimeFormat: datetime.format,
      datetimeRate: datetime.rate,
      dateOnlyFormat: dateOnly.format,
      dateOnlyRate: dateOnly.rate,
      timeOnlyRate: matchRate(values, parseTimeOnly),
      numericRate: matchRate(values, parseLocaleNumber),
    };
  });

  const singleCandidate = pickBest(perColumn, (c) => c.datetimeRate + (c.isDateHeader ? HEADER_HINT_BONUS : 0));
  const dateCandidate = pickBest(perColumn, (c) => c.dateOnlyRate + (c.isDateHeader ? HEADER_HINT_BONUS : 0));
  const timeCandidate = pickBest(
    perColumn.filter((c) => c.col !== dateCandidate?.col),
    (c) => c.timeOnlyRate + (c.isTimeHeader ? HEADER_HINT_BONUS : 0),
  );

  const singleOk = !!singleCandidate && singleCandidate.datetimeRate >= CONFIDENCE_THRESHOLD;
  const splitOk =
    !!dateCandidate &&
    !!timeCandidate &&
    dateCandidate.dateOnlyRate >= CONFIDENCE_THRESHOLD &&
    timeCandidate.timeOnlyRate >= CONFIDENCE_THRESHOLD;

  let timestampMode: ColumnMapping['timestampMode'] = 'single';
  let timestampCol = 0;
  let dateCol = 0;
  let timeCol = Math.min(1, Math.max(columnCount - 1, 0));
  let dateFormat: string = DATETIME_FORMATS[0];
  const usedTimestampCols = new Set<number>();

  const splitRate = splitOk ? (dateCandidate!.dateOnlyRate + timeCandidate!.timeOnlyRate) / 2 : -1;

  if (singleOk && singleCandidate!.datetimeRate >= splitRate) {
    timestampCol = singleCandidate!.col;
    dateFormat = singleCandidate!.datetimeFormat;
    usedTimestampCols.add(timestampCol);
  } else if (splitOk) {
    timestampMode = 'split';
    dateCol = dateCandidate!.col;
    timeCol = timeCandidate!.col;
    dateFormat = dateCandidate!.dateOnlyFormat;
    usedTimestampCols.add(dateCol);
    usedTimestampCols.add(timeCol);
  } else {
    usedTimestampCols.add(timestampCol);
  }

  const valueCandidate = pickBest(
    perColumn.filter((c) => !usedTimestampCols.has(c.col)),
    (c) => c.numericRate + (c.isValueHeader ? HEADER_HINT_BONUS : 0),
  );
  const fallbackValueCol = columns.find((c) => !usedTimestampCols.has(c)) ?? Math.min(1, Math.max(columnCount - 1, 0));
  const valueCol = valueCandidate && valueCandidate.numericRate >= CONFIDENCE_THRESHOLD ? valueCandidate.col : fallbackValueCol;

  const valueHeader = headerOf(rows, hasHeader, valueCol);
  const valueHeaderTokens = valueHeader.split(/[^a-z0-9]+/);
  let valueUnit: ColumnMapping['valueUnit'] = 'kWh';
  if (valueHeader.includes('kwh')) valueUnit = 'kWh';
  else if (valueHeaderTokens.includes('kw')) valueUnit = 'kW';
  else if (valueHeaderTokens.includes('w')) valueUnit = 'W';

  const timestampHeader = timestampMode === 'single' ? headerOf(rows, hasHeader, timestampCol) : headerOf(rows, hasHeader, dateCol);
  const timestampAlignment: ColumnMapping['timestampAlignment'] = includesAny(timestampHeader, START_HEADER_HINTS)
    ? 'start'
    : 'end';

  const typeFilter = detectTypeFilterColumn(dataRows, columnCount, new Set([...usedTimestampCols, valueCol]));

  return {
    hasHeader,
    timestampMode,
    timestampCol,
    dateCol,
    timeCol,
    valueCol,
    dateFormat,
    timestampAlignment,
    valueUnit,
    filterCol: typeFilter?.col ?? null,
    filterValue: typeFilter?.value ?? '',
    gridBackfeedValue: typeFilter?.backfeedValue ?? null,
    missingStatusCol: null,
    missingStatusValue: '',
  };
}
