import { combineDateAndTime, parseTimestamp } from '../csv/dateFormats.js';
import { parseLocaleNumber } from '../csv/numberParse.js';
import type { FileMappingInput } from './types.js';

export interface EnergyInterval {
  start: number;
  end: number;
  kWh: number;
}

export interface AlignedSeries {
  timestamps: number[];
  consumptionKWh: number[];
  productionKWh: number[];
  /** Optional grid-export (Visszatáplált) series, redistributed onto the same grid, if supplied. */
  gridExportKWh: number[] | null;
  /** The time range the grid-export input actually covers (for deciding which months have full coverage). */
  gridExportCoverage: { start: number; end: number } | null;
  intervalMinutes: number;
}

export interface FailedRowSample {
  /** 1-based line number in the original file (including the header row, if any). */
  line: number;
  row: string[];
  reason: 'timestamp' | 'value';
}

export interface RowParseDiagnostics {
  totalDataRows: number;
  filteredOut: number;
  timestampParseFailed: number;
  valueParseFailed: number;
  valid: number;
  sampleFailedRows: FailedRowSample[];
  /** Rows marked as "no data" by the status column, whose value was replaced by a prior day's. */
  missingSubstituted: number;
  /** Rows marked as "no data" for which no usable prior-day value could be found either. */
  missingUnresolved: number;
}

const MAX_SAMPLE_FAILED_ROWS = 5;
const DAY_MS = 24 * 60 * 60_000;
const MAX_LOOKBACK_DAYS = 30;

export interface EnergyIntervalResult {
  intervals: EnergyInterval[];
  diagnostics: RowParseDiagnostics;
}

const GRID_MS = 15 * 60_000;

function resolveTimestamp(row: string[], mapping: FileMappingInput['mapping']): number | null {
  if (mapping.timestampMode === 'single') {
    const raw = row[mapping.timestampCol];
    if (raw === undefined) return null;
    return parseTimestamp(raw, mapping.dateFormat);
  }
  const dateRaw = row[mapping.dateCol];
  const timeRaw = row[mapping.timeCol];
  if (dateRaw === undefined || timeRaw === undefined) return null;
  return combineDateAndTime(dateRaw, mapping.dateFormat, timeRaw);
}

function detectIntervalMs(sortedTimestamps: number[]): number {
  const diffs: number[] = [];
  for (let i = 1; i < sortedTimestamps.length; i++) {
    const d = sortedTimestamps[i] - sortedTimestamps[i - 1];
    if (d > 0) diffs.push(d);
  }
  if (diffs.length === 0) return GRID_MS;
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)];
}

/** Parses raw CSV rows into energy intervals ([start, end) in epoch ms + kWh), using the given column mapping. */
export function rowsToEnergyIntervals(input: FileMappingInput): EnergyIntervalResult {
  const { rows, mapping } = input;
  const dataRows = mapping.hasHeader ? rows.slice(1) : rows;

  const diagnostics: RowParseDiagnostics = {
    totalDataRows: dataRows.length,
    filteredOut: 0,
    timestampParseFailed: 0,
    valueParseFailed: 0,
    valid: 0,
    sampleFailedRows: [],
    missingSubstituted: 0,
    missingUnresolved: 0,
  };
  const headerOffset = mapping.hasHeader ? 1 : 0;

  const parsed: { ts: number; value: number; isMissing: boolean }[] = [];
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (mapping.filterCol !== null && row[mapping.filterCol]?.trim() !== mapping.filterValue) {
      diagnostics.filteredOut++;
      continue;
    }
    const ts = resolveTimestamp(row, mapping);
    if (ts === null) {
      diagnostics.timestampParseFailed++;
      if (diagnostics.sampleFailedRows.filter((s) => s.reason === 'timestamp').length < MAX_SAMPLE_FAILED_ROWS) {
        diagnostics.sampleFailedRows.push({ line: i + headerOffset + 1, row, reason: 'timestamp' });
      }
      continue;
    }

    // A row flagged by the status column as "no reading" is allowed to have an
    // empty/garbage value - it gets backfilled from a prior day below rather than
    // being rejected outright.
    const isMissing =
      mapping.missingStatusCol !== null && row[mapping.missingStatusCol]?.trim() === mapping.missingStatusValue;

    const raw = row[mapping.valueCol];
    const parsedValue = raw === undefined ? null : parseLocaleNumber(raw);
    if (parsedValue === null && !isMissing) {
      diagnostics.valueParseFailed++;
      if (diagnostics.sampleFailedRows.filter((s) => s.reason === 'value').length < MAX_SAMPLE_FAILED_ROWS) {
        diagnostics.sampleFailedRows.push({ line: i + headerOffset + 1, row, reason: 'value' });
      }
      continue;
    }
    diagnostics.valid++;
    parsed.push({ ts, value: parsedValue ?? 0, isMissing });
  }

  parsed.sort((a, b) => a.ts - b.ts);

  // Deduplicate identical timestamps (keep last occurrence).
  const dedup: { ts: number; value: number; isMissing: boolean }[] = [];
  for (const p of parsed) {
    if (dedup.length > 0 && dedup[dedup.length - 1].ts === p.ts) {
      dedup[dedup.length - 1] = p;
    } else {
      dedup.push(p);
    }
  }

  if (dedup.length === 0) return { intervals: [], diagnostics };

  // Rows flagged by the status column as "no reading" get the same time-of-day value
  // from the closest prior day that does have a real reading, instead of being trusted as-is.
  if (mapping.missingStatusCol !== null) {
    const byTs = new Map(dedup.map((p) => [p.ts, p]));
    for (const p of dedup) {
      if (!p.isMissing) continue;
      let resolved = false;
      for (let back = 1; back <= MAX_LOOKBACK_DAYS; back++) {
        const prior = byTs.get(p.ts - back * DAY_MS);
        if (prior && !prior.isMissing) {
          p.value = prior.value;
          resolved = true;
          break;
        }
      }
      if (resolved) diagnostics.missingSubstituted++;
      else diagnostics.missingUnresolved++;
    }
  }

  const intervalMs = detectIntervalMs(dedup.map((p) => p.ts));
  const intervalHours = intervalMs / 3_600_000;

  const intervals = dedup.map(({ ts, value }) => {
    let kWh: number;
    if (mapping.valueUnit === 'kWh') kWh = value;
    else if (mapping.valueUnit === 'kW') kWh = value * intervalHours;
    else kWh = (value / 1000) * intervalHours; // W

    const [start, end] =
      mapping.timestampAlignment === 'end' ? [ts - intervalMs, ts] : [ts, ts + intervalMs];
    return { start, end, kWh };
  });

  return { intervals, diagnostics };
}

function redistributeToGrid(intervals: EnergyInterval[], rangeStart: number, rangeEnd: number): Map<number, number> {
  const buckets = new Map<number, number>();
  for (const { start, end, kWh } of intervals) {
    const duration = end - start;
    if (duration <= 0) continue;
    const rate = kWh / duration; // kWh per ms
    let t = Math.max(start, rangeStart);
    const stop = Math.min(end, rangeEnd);
    while (t < stop) {
      const bucketStart = Math.floor(t / GRID_MS) * GRID_MS;
      const bucketEnd = bucketStart + GRID_MS;
      const sliceEnd = Math.min(stop, bucketEnd);
      const energy = rate * (sliceEnd - t);
      buckets.set(bucketStart, (buckets.get(bucketStart) ?? 0) + energy);
      t = sliceEnd;
    }
  }
  return buckets;
}

/**
 * Aligns consumption and production energy intervals onto a shared 15-minute grid,
 * restricted to the overlapping time range of both series (energy is redistributed
 * proportionally when a source interval doesn't already line up with the grid).
 */
export function alignSeries(
  consumption: EnergyInterval[],
  production: EnergyInterval[],
  gridExport?: EnergyInterval[] | null,
): AlignedSeries {
  if (consumption.length === 0 || production.length === 0) {
    throw new Error('A fogyasztási vagy a termelési fájlból nem sikerült érvényes adatot kinyerni.');
  }

  const consumptionRange = {
    start: Math.min(...consumption.map((p) => p.start)),
    end: Math.max(...consumption.map((p) => p.end)),
  };
  const productionRange = {
    start: Math.min(...production.map((p) => p.start)),
    end: Math.max(...production.map((p) => p.end)),
  };

  const rawStart = Math.max(consumptionRange.start, productionRange.start);
  const rawEnd = Math.min(consumptionRange.end, productionRange.end);

  if (rawEnd <= rawStart) {
    throw new Error(
      'A két fájl időtartománya nem fedi egymást – nincs közös időszak, amire a szimulációt el lehetne végezni.',
    );
  }

  const rangeStart = Math.floor(rawStart / GRID_MS) * GRID_MS;
  const rangeEnd = Math.ceil(rawEnd / GRID_MS) * GRID_MS;

  const consumptionBuckets = redistributeToGrid(consumption, rangeStart, rangeEnd);
  const productionBuckets = redistributeToGrid(production, rangeStart, rangeEnd);

  const hasGridExport = Boolean(gridExport && gridExport.length > 0);
  const gridExportBuckets = hasGridExport ? redistributeToGrid(gridExport!, rangeStart, rangeEnd) : null;
  const gridExportCoverage = hasGridExport
    ? {
        start: Math.min(...gridExport!.map((p) => p.start)),
        end: Math.max(...gridExport!.map((p) => p.end)),
      }
    : null;

  const timestamps: number[] = [];
  const consumptionKWh: number[] = [];
  const productionKWh: number[] = [];
  const gridExportKWh: number[] | null = gridExportBuckets ? [] : null;

  for (let t = rangeStart; t < rangeEnd; t += GRID_MS) {
    timestamps.push(t);
    consumptionKWh.push(consumptionBuckets.get(t) ?? 0);
    productionKWh.push(productionBuckets.get(t) ?? 0);
    if (gridExportBuckets && gridExportKWh) gridExportKWh.push(gridExportBuckets.get(t) ?? 0);
  }

  return { timestamps, consumptionKWh, productionKWh, gridExportKWh, gridExportCoverage, intervalMinutes: 15 };
}
