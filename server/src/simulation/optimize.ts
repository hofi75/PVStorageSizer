import { NIGHT_EPSILON_KWH, simulateBattery } from './simulate.js';
import { monthLabel } from '../i18n.js';
import type { Lang } from '../i18n.js';
import type {
  DailyProfilePoint,
  IntervalSeriesData,
  MonthlyConsumptionPoint,
  MonthlyNightPoint,
  SimulationMeta,
  SimulationParams,
  SimulationResponse,
  SweepPoint,
} from './types.js';

function monthKeyAndLabel(lang: Lang, timestampMs: number): { key: string; label: string } {
  const d = new Date(timestampMs);
  const year = d.getFullYear();
  const month = d.getMonth();
  const key = `${year}-${String(month + 1).padStart(2, '0')}`;
  return { key, label: monthLabel(lang, timestampMs) };
}

function dayKey(timestampMs: number): string {
  const d = new Date(timestampMs);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function buildSweepCapacities(params: SimulationParams): number[] {
  const step = Math.max(params.sweepStepKWh, 0.1);
  const caps = new Set<number>([0]);
  for (let c = params.sweepMinKWh; c <= params.sweepMaxKWh + 1e-9; c += step) {
    caps.add(Math.round(Math.max(c, 0) * 100) / 100);
  }
  caps.add(Math.round(Math.max(params.sweepMaxKWh, 0) * 100) / 100);
  return Array.from(caps).sort((a, b) => a - b);
}

function toSweepPoint(
  capacityKWh: number,
  sim: ReturnType<typeof simulateBattery>,
  baselineExportKWh: number,
  totalProductionKWh: number,
  days: number,
): SweepPoint {
  const exportReductionPct =
    baselineExportKWh > 0 ? ((baselineExportKWh - sim.gridExportKWh) / baselineExportKWh) * 100 : 0;
  const selfConsumptionPct =
    totalProductionKWh > 0 ? ((totalProductionKWh - sim.gridExportKWh) / totalProductionKWh) * 100 : 0;
  const dailyCycles = capacityKWh > 0 && days > 0 ? sim.dischargedKWh / (capacityKWh * days) : 0;
  const nightCoveragePct =
    sim.nightConsumptionKWh > 0 ? (sim.nightBatteryServedKWh / sim.nightConsumptionKWh) * 100 : 0;

  return {
    capacityKWh,
    gridImportKWh: sim.gridImportKWh,
    gridExportKWh: sim.gridExportKWh,
    exportReductionPct,
    selfConsumptionPct,
    dailyCycles,
    nightCoveragePct,
  };
}

/** Below this rate (percentage points of export reduction gained per additional kWh of
 *  capacity), an extra kWh of battery is considered not worth it. */
const MARGINAL_RETURN_THRESHOLD_PCT_PER_KWH = 1;

/**
 * Finds the "knee" of the (capacity, export-reduction) curve: the smallest capacity
 * beyond which each additional kWh stops buying a meaningful amount of extra export
 * reduction. Walks the curve from its smallest tested capacity upward, purely by local
 * marginal return between adjacent tested points - deliberately NOT relative to the
 * curve's overall endpoints, so the result reflects the underlying data rather than
 * wherever the user happened to set the sweep's min/max (that previously made the
 * recommendation shift when only the tested range changed, even though the physical
 * consumption/production data - and so the true optimum - hadn't).
 */
function findKneePoint(points: SweepPoint[]): SweepPoint {
  const sorted = [...points].sort((a, b) => a.capacityKWh - b.capacityKWh);
  let chosen = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const deltaCapacity = sorted[i].capacityKWh - sorted[i - 1].capacityKWh;
    if (deltaCapacity <= 0) continue;
    const deltaReduction = sorted[i].exportReductionPct - sorted[i - 1].exportReductionPct;
    const marginalRate = deltaReduction / deltaCapacity;
    if (marginalRate < MARGINAL_RETURN_THRESHOLD_PCT_PER_KWH) break;
    chosen = sorted[i];
  }
  return chosen;
}

function buildReason(lang: Lang, recommended: SweepPoint, points: SweepPoint[], baselineImportKWh: number): string {
  const idx = points.findIndex((p) => p.capacityKWh === recommended.capacityKWh);
  const next = idx >= 0 ? points[idx + 1] : undefined;
  const importSavingKWh = Math.max(0, baselineImportKWh - recommended.gridImportKWh);
  const importSavingPct = baselineImportKWh > 0 ? (importSavingKWh / baselineImportKWh) * 100 : 0;

  if (lang === 'hu') {
    let marginalNote = '';
    if (next) {
      const extraCapacity = next.capacityKWh - recommended.capacityKWh;
      const extraReduction = next.exportReductionPct - recommended.exportReductionPct;
      marginalNote = ` Egy ${extraCapacity.toFixed(1)} kWh-val nagyobb tároló a visszatöltést már csak további kb. ${extraReduction.toFixed(1)} százalékponttal csökkentené, egyre rosszabb kihasználtság mellett.`;
    }
    const cycleNote =
      recommended.dailyCycles < 0.3
        ? ' Ez a méret is viszonylag alacsony kihasználtságú (napi 0,3 ciklusnál kevesebb) – ha a beruházási költség fontos szempont, érdemes lehet kisebb kapacitást választani.'
        : '';
    return (
      `A ${recommended.capacityKWh.toFixed(1)} kWh kapacitás a hálózatba visszatöltött energiát ` +
      `${recommended.exportReductionPct.toFixed(0)}%-kal csökkenti a tárolás nélküli esethez képest, ` +
      `napi átlagban kb. ${recommended.dailyCycles.toFixed(2)} teljes ciklust futva, és az éjszakai ` +
      `fogyasztás ${recommended.nightCoveragePct.toFixed(0)}%-át fedezi a napközbeni termelésből. ` +
      `A hálózatból vételezett energiát is kb. ${importSavingKWh.toFixed(0)} kWh-val (${importSavingPct.toFixed(0)}%) ` +
      `csökkenti a tárolás nélküli esethez képest.` +
      `${marginalNote}${cycleNote}`
    );
  }

  if (lang === 'de') {
    let marginalNote = '';
    if (next) {
      const extraCapacity = next.capacityKWh - recommended.capacityKWh;
      const extraReduction = next.exportReductionPct - recommended.exportReductionPct;
      marginalNote = ` Ein um ${extraCapacity.toFixed(1)} kWh größerer Speicher würde die Einspeisung nur noch um weitere ca. ${extraReduction.toFixed(1)} Prozentpunkte senken, bei zunehmend schlechterer Auslastung.`;
    }
    const cycleNote =
      recommended.dailyCycles < 0.3
        ? ' Auch diese Größe hat eine relativ geringe Auslastung (weniger als 0.3 Zyklen pro Tag) - falls die Investitionskosten wichtig sind, könnte eine kleinere Kapazität sinnvoll sein.'
        : '';
    return (
      `Die Kapazität von ${recommended.capacityKWh.toFixed(1)} kWh reduziert die ins Netz eingespeiste Energie ` +
      `um ${recommended.exportReductionPct.toFixed(0)}% gegenüber dem Fall ohne Speicher, bei durchschnittlich ` +
      `ca. ${recommended.dailyCycles.toFixed(2)} vollen Zyklen pro Tag, und deckt ${recommended.nightCoveragePct.toFixed(0)}% ` +
      `des nächtlichen Verbrauchs aus der Tageserzeugung. Außerdem reduziert sie die aus dem Netz bezogene Energie ` +
      `gegenüber dem Fall ohne Speicher um etwa ${importSavingKWh.toFixed(0)} kWh (${importSavingPct.toFixed(0)}%).` +
      `${marginalNote}${cycleNote}`
    );
  }

  let marginalNote = '';
  if (next) {
    const extraCapacity = next.capacityKWh - recommended.capacityKWh;
    const extraReduction = next.exportReductionPct - recommended.exportReductionPct;
    marginalNote = ` A storage ${extraCapacity.toFixed(1)} kWh larger would only reduce grid export by a further ~${extraReduction.toFixed(1)} percentage points, with progressively worse utilization.`;
  }
  const cycleNote =
    recommended.dailyCycles < 0.3
      ? ' This size also has relatively low utilization (fewer than 0.3 cycles per day) - if upfront cost matters, a smaller capacity may be worth considering.'
      : '';
  return (
    `A capacity of ${recommended.capacityKWh.toFixed(1)} kWh reduces energy exported to the grid by ` +
    `${recommended.exportReductionPct.toFixed(0)}% compared to no storage, running about ` +
    `${recommended.dailyCycles.toFixed(2)} full cycles per day on average, and covers ` +
    `${recommended.nightCoveragePct.toFixed(0)}% of night consumption from daytime production. It also cuts ` +
    `the energy drawn from the grid by about ${importSavingKWh.toFixed(0)} kWh (${importSavingPct.toFixed(0)}%) ` +
    `compared to no storage.` +
    `${marginalNote}${cycleNote}`
  );
}

function buildDailyProfile(
  timestamps: number[],
  consumptionKWh: number[],
  productionKWh: number[],
  trace: NonNullable<ReturnType<typeof simulateBattery>['trace']>,
  intervalMinutes: number,
): DailyProfilePoint[] {
  const slotsPerDay = Math.round((24 * 60) / intervalMinutes);
  const sums = Array.from({ length: slotsPerDay }, () => ({ c: 0, p: 0, soc: 0, imp: 0, exp: 0, count: 0 }));

  for (let i = 0; i < timestamps.length; i++) {
    const d = new Date(timestamps[i]);
    const minuteOfDay = d.getHours() * 60 + d.getMinutes();
    const slot = Math.round(minuteOfDay / intervalMinutes) % slotsPerDay;
    const s = sums[slot];
    s.c += consumptionKWh[i];
    s.p += productionKWh[i];
    s.soc += trace.socKWh[i];
    s.imp += trace.gridImportKWh[i];
    s.exp += trace.gridExportKWh[i];
    s.count += 1;
  }

  return sums.map((s, slot) => {
    const minuteOfDay = slot * intervalMinutes;
    const hh = String(Math.floor(minuteOfDay / 60)).padStart(2, '0');
    const mm = String(minuteOfDay % 60).padStart(2, '0');
    const n = Math.max(s.count, 1);
    return {
      minuteOfDay,
      label: `${hh}:${mm}`,
      avgConsumptionKWh: s.c / n,
      avgProductionKWh: s.p / n,
      avgSoCKWh: s.soc / n,
      avgGridImportKWh: s.imp / n,
      avgGridExportKWh: s.exp / n,
    };
  });
}

/**
 * For each night - defined as the span from a day's last produced interval to the
 * next produced interval (usually the following day's first) - records the total
 * consumption during that dark span and the battery's SoC at the moment it began,
 * then averages those per calendar month.
 */
function buildMonthlyNightProfile(
  lang: Lang,
  timestamps: number[],
  consumptionKWh: number[],
  productionKWh: number[],
  socKWh: number[],
): MonthlyNightPoint[] {
  const prodIdx: number[] = [];
  for (let i = 0; i < productionKWh.length; i++) {
    if (productionKWh[i] > NIGHT_EPSILON_KWH) prodIdx.push(i);
  }

  const byMonth = new Map<string, { label: string; count: number; consumptionSum: number; socSum: number }>();

  for (let k = 0; k < prodIdx.length - 1; k++) {
    const nightStart = prodIdx[k];
    const nightEnd = prodIdx[k + 1];
    if (dayKey(timestamps[nightStart]) === dayKey(timestamps[nightEnd])) continue; // still the same day - not a night gap

    let nightConsumption = 0;
    for (let i = nightStart + 1; i < nightEnd; i++) nightConsumption += consumptionKWh[i];

    const { key, label } = monthKeyAndLabel(lang, timestamps[nightStart]);
    const entry = byMonth.get(key) ?? { label, count: 0, consumptionSum: 0, socSum: 0 };
    entry.count += 1;
    entry.consumptionSum += nightConsumption;
    entry.socSum += socKWh[nightStart];
    byMonth.set(key, entry);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, e]) => ({
      month,
      label: e.label,
      nightsCount: e.count,
      avgNightConsumptionKWh: e.consumptionSum / e.count,
      avgNightStartSoCKWh: e.socSum / e.count,
    }));
}

/**
 * True household consumption isn't just the grid-import (Vételezett) series: solar
 * self-consumed directly (never touching the grid meter) is invisible to it. Given
 * grid import, production, and grid export (Visszatáplált) all measured, the true
 * load is import + production - export. Aggregated to monthly totals, only for
 * months fully covered by the grid-export input.
 */
function buildMonthlyConsumptionProfile(
  lang: Lang,
  timestamps: number[],
  consumptionKWh: number[],
  productionKWh: number[],
  gridExportKWh: number[],
  gridExportCoverage: { start: number; end: number },
): MonthlyConsumptionPoint[] {
  const byMonth = new Map<string, { label: string; consumption: number; gridImport: number; selfConsumed: number }>();

  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i] < gridExportCoverage.start || timestamps[i] >= gridExportCoverage.end) continue;

    const selfConsumedSolar = Math.max(0, productionKWh[i] - gridExportKWh[i]);
    const trueConsumption = consumptionKWh[i] + productionKWh[i] - gridExportKWh[i];

    const { key, label } = monthKeyAndLabel(lang, timestamps[i]);
    const entry = byMonth.get(key) ?? { label, consumption: 0, gridImport: 0, selfConsumed: 0 };
    entry.consumption += trueConsumption;
    entry.gridImport += consumptionKWh[i];
    entry.selfConsumed += selfConsumedSolar;
    byMonth.set(key, entry);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, e]) => ({
      month,
      label: e.label,
      totalConsumptionKWh: e.consumption,
      totalGridImportKWh: e.gridImport,
      totalSelfConsumedSolarKWh: e.selfConsumed,
    }));
}

/** Packages the recommended-capacity simulation trace for the day-selector chart. */
function buildIntervalSeries(
  timestamps: number[],
  consumptionKWh: number[],
  productionKWh: number[],
  trace: NonNullable<ReturnType<typeof simulateBattery>['trace']>,
): IntervalSeriesData {
  return {
    timestamps,
    socKWh: trace.socKWh,
    gridExportKWh: trace.gridExportKWh,
    gridImportKWh: trace.gridImportKWh,
    batteryDischargeKWh: trace.batteryDischargeKWh,
    totalConsumptionKWh: consumptionKWh,
    totalProductionKWh: productionKWh,
  };
}

/** Merges a point into a sweep array by capacity, replacing any existing point at the
 *  same capacity - used so buildReason's "next capacity" comparison still makes sense
 *  when the selected capacity is an arbitrary value the user picked, not one already
 *  in the sweep grid. */
function pointsWithSelection(sweep: SweepPoint[], selected: SweepPoint): SweepPoint[] {
  const withoutDup = sweep.filter((p) => p.capacityKWh !== selected.capacityKWh);
  return [...withoutDup, selected].sort((a, b) => a.capacityKWh - b.capacityKWh);
}

export function runSimulation(
  lang: Lang,
  timestamps: number[],
  consumptionKWh: number[],
  productionKWh: number[],
  intervalMinutes: number,
  params: SimulationParams,
  gridExportKWh?: number[] | null,
  gridExportCoverage?: { start: number; end: number } | null,
  forcedCapacityKWh?: number,
): SimulationResponse {
  const intervalHours = intervalMinutes / 60;
  const slotsPerDay = Math.round((24 * 60) / intervalMinutes);
  const days = timestamps.length / slotsPerDay;

  const capacities = buildSweepCapacities(params);
  const totalProductionKWh = productionKWh.reduce((a, b) => a + b, 0);
  const totalConsumptionKWh = consumptionKWh.reduce((a, b) => a + b, 0);

  const baselineSim = simulateBattery(consumptionKWh, productionKWh, {
    capacityKWh: 0,
    roundTripEfficiencyPct: params.roundTripEfficiencyPct,
    maxPowerCRate: params.maxPowerCRate,
    minSocReservePct: params.minSocReservePct,
    intervalHours,
  });
  const baselineExportKWh = baselineSim.gridExportKWh;

  const sweep: SweepPoint[] = capacities.map((capacityKWh) => {
    const sim =
      capacityKWh === 0
        ? baselineSim
        : simulateBattery(consumptionKWh, productionKWh, {
            capacityKWh,
            roundTripEfficiencyPct: params.roundTripEfficiencyPct,
            maxPowerCRate: params.maxPowerCRate,
            minSocReservePct: params.minSocReservePct,
            intervalHours,
          });
    return toSweepPoint(capacityKWh, sim, baselineExportKWh, totalProductionKWh, days);
  });

  // buildSweepCapacities always includes a capacity=0 baseline point regardless of
  // sweepMinKWh, purely so the sweep chart/export-reduction-% baseline is available -
  // it's not actually part of the user's requested search range unless they set the
  // minimum to 0 themselves, so exclude it from the recommendation search accordingly.
  const searchRangeSweep = sweep.filter((p) => p.capacityKWh >= params.sweepMinKWh - 1e-9);
  const knee = findKneePoint(searchRangeSweep.length > 0 ? searchRangeSweep : sweep);

  // The detailed trace/charts/reason are for whichever capacity is currently selected -
  // the server's own recommendation by default, or a capacity the user picked instead.
  const selectedPoint =
    forcedCapacityKWh === undefined || forcedCapacityKWh === knee.capacityKWh
      ? knee
      : toSweepPoint(
          forcedCapacityKWh,
          simulateBattery(consumptionKWh, productionKWh, {
            capacityKWh: forcedCapacityKWh,
            roundTripEfficiencyPct: params.roundTripEfficiencyPct,
            maxPowerCRate: params.maxPowerCRate,
            minSocReservePct: params.minSocReservePct,
            intervalHours,
          }),
          baselineExportKWh,
          totalProductionKWh,
          days,
        );
  const reason = buildReason(lang, selectedPoint, pointsWithSelection(sweep, selectedPoint), baselineSim.gridImportKWh);

  const selectedSim = simulateBattery(consumptionKWh, productionKWh, {
    capacityKWh: selectedPoint.capacityKWh,
    roundTripEfficiencyPct: params.roundTripEfficiencyPct,
    maxPowerCRate: params.maxPowerCRate,
    minSocReservePct: params.minSocReservePct,
    intervalHours,
    collectTrace: true,
  });
  const dailyProfile = buildDailyProfile(
    timestamps,
    consumptionKWh,
    productionKWh,
    selectedSim.trace!,
    intervalMinutes,
  );

  const monthlyNightProfile = buildMonthlyNightProfile(
    lang,
    timestamps,
    consumptionKWh,
    productionKWh,
    selectedSim.trace!.socKWh,
  );

  const monthlyConsumptionProfile =
    gridExportKWh && gridExportCoverage
      ? buildMonthlyConsumptionProfile(
          lang,
          timestamps,
          consumptionKWh,
          productionKWh,
          gridExportKWh,
          gridExportCoverage,
        )
      : null;

  const intervalSeries = buildIntervalSeries(timestamps, consumptionKWh, productionKWh, selectedSim.trace!);

  const meta: SimulationMeta = {
    days,
    intervalMinutes,
    totalConsumptionKWh,
    totalProductionKWh,
    alignedPoints: timestamps.length,
    rangeStartIso: new Date(timestamps[0]).toISOString(),
    rangeEndIso: new Date(timestamps[timestamps.length - 1] + intervalMinutes * 60_000).toISOString(),
  };

  return {
    sweep,
    recommendedCapacityKWh: knee.capacityKWh,
    selected: { ...selectedPoint, reason },
    dailyProfile,
    monthlyNightProfile,
    monthlyConsumptionProfile,
    intervalSeries,
    meta,
  };
}
