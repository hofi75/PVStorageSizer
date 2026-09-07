export type TimestampMode = 'single' | 'split';
export type TimestampAlignment = 'start' | 'end';
export type ValueUnit = 'kWh' | 'kW' | 'W';

export interface ColumnMapping {
  hasHeader: boolean;
  timestampMode: TimestampMode;
  timestampCol: number;
  dateCol: number;
  timeCol: number;
  valueCol: number;
  dateFormat: string;
  timestampAlignment: TimestampAlignment;
  valueUnit: ValueUnit;
  /** Optional row filter, e.g. for files that mix grid-usage and grid-backfeed rows
   *  distinguished by a "type" column (filterCol === null means no filtering). */
  filterCol: number | null;
  filterValue: string;
  /** When filterCol is set on a grid-data file, the value (in the same column) that
   *  marks grid-backfeed rows - lets the backfeed series be derived from this same
   *  file/column instead of requiring a separate upload (null means not applicable/
   *  not detected, so no backfeed series is derived). */
  gridBackfeedValue: string | null;
  /** Optional "status" column marking rows with no real reading (e.g. "Nincs"); such
   *  rows have their value replaced by the same time-of-day value from a prior day
   *  instead of being trusted as-is (missingStatusCol === null means no such marking). */
  missingStatusCol: number | null;
  missingStatusValue: string;
}

export interface FileMappingInput {
  rows: string[][];
  mapping: ColumnMapping;
}

export interface ParsedCsv {
  delimiter: string;
  rows: string[][];
  suggestedHeader: boolean;
  columnCount: number;
  suggestedMapping: ColumnMapping;
}

export interface SimulationParams {
  roundTripEfficiencyPct: number;
  maxPowerCRate: number;
  minSocReservePct: number;
  sweepMinKWh: number;
  sweepMaxKWh: number;
  sweepStepKWh: number;
}

export interface SweepPoint {
  capacityKWh: number;
  gridImportKWh: number;
  gridExportKWh: number;
  exportReductionPct: number;
  selfConsumptionPct: number;
  dailyCycles: number;
  nightCoveragePct: number;
}

export interface DailyProfilePoint {
  minuteOfDay: number;
  label: string;
  avgConsumptionKWh: number;
  avgProductionKWh: number;
  avgSoCKWh: number;
  avgGridImportKWh: number;
  avgGridExportKWh: number;
}

export interface MonthlyNightPoint {
  month: string;
  label: string;
  nightsCount: number;
  avgNightConsumptionKWh: number;
  avgNightStartSoCKWh: number;
}

export interface MonthlyConsumptionPoint {
  month: string;
  label: string;
  totalConsumptionKWh: number;
  totalGridImportKWh: number;
  totalSelfConsumedSolarKWh: number;
}

export interface IntervalSeriesData {
  timestamps: number[];
  socKWh: number[];
  gridExportKWh: number[];
  gridImportKWh: number[];
  batteryDischargeKWh: number[];
  totalConsumptionKWh: number[];
  totalProductionKWh: number[];
}

export interface SimulationMeta {
  days: number;
  intervalMinutes: number;
  totalConsumptionKWh: number;
  totalProductionKWh: number;
  alignedPoints: number;
  rangeStartIso: string;
  rangeEndIso: string;
}

export interface SimulationResponse {
  sweep: SweepPoint[];
  /** The server's own capacity recommendation (the sweep curve's knee point), regardless
   *  of which capacity is currently selected below. */
  recommendedCapacityKWh: number;
  /** Detailed stats/reason for the capacity currently being shown - the recommendation
   *  by default, or a capacity the user chose to inspect instead. */
  selected: SweepPoint & { reason: string };
  dailyProfile: DailyProfilePoint[];
  monthlyNightProfile: MonthlyNightPoint[];
  monthlyConsumptionProfile: MonthlyConsumptionPoint[] | null;
  intervalSeries: IntervalSeriesData;
  meta: SimulationMeta;
  warnings?: string[];
}

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

export const DATE_ONLY_FORMATS = [
  'YYYY-MM-DD',
  'YYYY.MM.DD',
  'YYYY.MM.DD.',
  'DD.MM.YYYY',
  'DD/MM/YYYY',
  'MM/DD/YYYY',
] as const;

export function defaultParams(): SimulationParams {
  return {
    roundTripEfficiencyPct: 90,
    maxPowerCRate: 1,
    minSocReservePct: 0,
    sweepMinKWh: 5,
    sweepMaxKWh: 40,
    sweepStepKWh: 1,
  };
}

const PARAMS_STORAGE_KEY = 'pvstoragesizer-params';

function isValidParams(v: unknown): v is SimulationParams {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  const keys: (keyof SimulationParams)[] = [
    'roundTripEfficiencyPct',
    'maxPowerCRate',
    'minSocReservePct',
    'sweepMinKWh',
    'sweepMaxKWh',
    'sweepStepKWh',
  ];
  return keys.every((k) => typeof obj[k] === 'number' && Number.isFinite(obj[k] as number));
}

/** Restores simulation parameters saved by a previous visit, so a page reload doesn't
 *  reset them back to the defaults. Falls back to defaults if nothing is stored, or if
 *  what's stored doesn't match the current shape (e.g. from an older app version). */
export function loadStoredParams(): SimulationParams {
  try {
    const raw = localStorage.getItem(PARAMS_STORAGE_KEY);
    if (!raw) return defaultParams();
    const parsed: unknown = JSON.parse(raw);
    return isValidParams(parsed) ? parsed : defaultParams();
  } catch {
    return defaultParams();
  }
}

export function saveParams(params: SimulationParams): void {
  try {
    localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(params));
  } catch {
    // localStorage may be unavailable (private browsing, quota) - persistence is a nice-to-have.
  }
}
