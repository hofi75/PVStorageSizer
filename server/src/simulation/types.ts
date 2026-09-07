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
  /** Optional row filter, e.g. for files that mix consumption and production rows
   *  distinguished by a "type" column (filterCol === null means no filtering). */
  filterCol: number | null;
  filterValue: string;
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
  recommended: SweepPoint & { reasonHu: string };
  dailyProfile: DailyProfilePoint[];
  monthlyNightProfile: MonthlyNightPoint[];
  monthlyConsumptionProfile: MonthlyConsumptionPoint[] | null;
  intervalSeries: IntervalSeriesData;
  meta: SimulationMeta;
  warnings?: string[];
}
