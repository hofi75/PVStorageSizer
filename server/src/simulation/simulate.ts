export interface SimulateOptions {
  capacityKWh: number;
  roundTripEfficiencyPct: number;
  maxPowerCRate: number;
  minSocReservePct: number;
  intervalHours: number;
  collectTrace?: boolean;
}

export interface SimulateTrace {
  socKWh: number[];
  gridImportKWh: number[];
  gridExportKWh: number[];
  /** Battery discharge that went toward covering consumption in this interval (not toward export). */
  batteryDischargeKWh: number[];
}

export interface SimulateResult {
  gridImportKWh: number;
  gridExportKWh: number;
  dischargedKWh: number;
  nightConsumptionKWh: number;
  nightBatteryServedKWh: number;
  trace?: SimulateTrace;
}

/** Production below this in a single interval counts as "no sun" for night-coverage purposes. */
export const NIGHT_EPSILON_KWH = 0.005;

/**
 * Simulates a battery of a given capacity against a consumption/production series
 * on a fixed-size grid (all arrays must be the same length and interval).
 */
export function simulateBattery(
  consumptionKWh: number[],
  productionKWh: number[],
  opts: SimulateOptions,
): SimulateResult {
  const n = consumptionKWh.length;
  const capacity = opts.capacityKWh;
  // Round-trip efficiency is split evenly between the charge and discharge legs.
  const eff = Math.sqrt(Math.min(Math.max(opts.roundTripEfficiencyPct, 1), 100) / 100);
  const minSoc = capacity * (opts.minSocReservePct / 100);
  const maxPowerKWh = capacity * opts.maxPowerCRate * opts.intervalHours;

  let soc = minSoc;
  let gridImportKWh = 0;
  let gridExportKWh = 0;
  let dischargedKWh = 0;
  let nightConsumptionKWh = 0;
  let nightBatteryServedKWh = 0;

  const trace: SimulateTrace | undefined = opts.collectTrace
    ? { socKWh: new Array(n), gridImportKWh: new Array(n), gridExportKWh: new Array(n), batteryDischargeKWh: new Array(n) }
    : undefined;

  for (let i = 0; i < n; i++) {
    const net = productionKWh[i] - consumptionKWh[i];
    let intervalImport = 0;
    let intervalExport = 0;
    let intervalDischarge = 0;

    if (net > 0) {
      const room = (capacity - soc) / eff;
      const charge = Math.min(net, room, maxPowerKWh);
      soc += charge * eff;
      intervalExport = net - charge;
    } else if (net < 0) {
      const deficit = -net;
      const available = (soc - minSoc) * eff;
      const discharge = Math.min(deficit, available, maxPowerKWh);
      soc -= discharge / eff;
      dischargedKWh += discharge;
      intervalImport = deficit - discharge;
      intervalDischarge = discharge;

      if (productionKWh[i] < NIGHT_EPSILON_KWH) {
        nightConsumptionKWh += deficit;
        nightBatteryServedKWh += discharge;
      }
    }

    soc = Math.min(capacity, Math.max(minSoc, soc));
    gridImportKWh += intervalImport;
    gridExportKWh += intervalExport;

    if (trace) {
      trace.socKWh[i] = soc;
      trace.gridImportKWh[i] = intervalImport;
      trace.gridExportKWh[i] = intervalExport;
      trace.batteryDischargeKWh[i] = intervalDischarge;
    }
  }

  return { gridImportKWh, gridExportKWh, dischargedKWh, nightConsumptionKWh, nightBatteryServedKWh, trace };
}
