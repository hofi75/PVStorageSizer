import { Router } from 'express';
import multer from 'multer';
import { parseCsvBuffer } from '../csv/parseCsv.js';
import { alignSeries, rowsToEnergyIntervals } from '../simulation/resample.js';
import type { RowParseDiagnostics } from '../simulation/resample.js';
import { runSimulation } from '../simulation/optimize.js';
import type { FileMappingInput, SimulationParams } from '../simulation/types.js';
import {
  resolveLang,
  noFileUploaded,
  emptyOrUnreadableCsv,
  csvParseFailed,
  incompleteSimulateRequest,
  describeEmptyResult,
  describePartialFailures,
} from '../i18n.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

export const analyzeRouter = Router();

analyzeRouter.post('/parse-csv', upload.single('file'), (req, res) => {
  const lang = resolveLang(req.body?.lang);

  if (!req.file) {
    res.status(400).json({ error: noFileUploaded(lang) });
    return;
  }
  try {
    const parsed = parseCsvBuffer(req.file.buffer);
    if (parsed.rows.length === 0) {
      res.status(400).json({ error: emptyOrUnreadableCsv(lang) });
      return;
    }
    res.json(parsed);
  } catch (err) {
    res.status(400).json({ error: csvParseFailed(lang, (err as Error).message) });
  }
});

interface SimulateRequestBody {
  consumption: FileMappingInput;
  production: FileMappingInput;
  gridExport?: FileMappingInput;
  params: SimulationParams;
  lang?: string;
  /** Recomputes the detailed stats/charts for this specific capacity instead of the
   *  server's own recommendation - used to let the user pick a different battery size
   *  after the initial run without re-uploading anything. */
  forcedCapacityKWh?: number;
}

function resolveForcedCapacityKWh(raw: unknown): number | undefined {
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : undefined;
}

function isFileMappingInput(v: unknown): v is FileMappingInput {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return Array.isArray(obj.rows) && typeof obj.mapping === 'object' && obj.mapping !== null;
}

analyzeRouter.post('/simulate', (req, res) => {
  const body = req.body as Partial<SimulateRequestBody>;
  const lang = resolveLang(body.lang);

  if (!isFileMappingInput(body.consumption) || !isFileMappingInput(body.production) || !body.params) {
    res.status(400).json({ error: incompleteSimulateRequest(lang) });
    return;
  }

  try {
    const consumption = rowsToEnergyIntervals(body.consumption);
    const production = rowsToEnergyIntervals(body.production);

    if (consumption.intervals.length === 0) {
      res.status(400).json({ error: describeEmptyResult(lang, 'consumption', consumption.diagnostics) });
      return;
    }
    if (production.intervals.length === 0) {
      res.status(400).json({ error: describeEmptyResult(lang, 'production', production.diagnostics) });
      return;
    }

    let gridExportIntervals: ReturnType<typeof rowsToEnergyIntervals>['intervals'] | null = null;
    let gridExportDiagnostics: RowParseDiagnostics | null = null;
    if (isFileMappingInput(body.gridExport)) {
      const gridExport = rowsToEnergyIntervals(body.gridExport);
      if (gridExport.intervals.length === 0) {
        res.status(400).json({ error: describeEmptyResult(lang, 'gridExport', gridExport.diagnostics) });
        return;
      }
      gridExportIntervals = gridExport.intervals;
      gridExportDiagnostics = gridExport.diagnostics;
    }

    const aligned = alignSeries(consumption.intervals, production.intervals, gridExportIntervals, lang);
    const result = runSimulation(
      lang,
      aligned.timestamps,
      aligned.consumptionKWh,
      aligned.productionKWh,
      aligned.intervalMinutes,
      body.params,
      aligned.gridExportKWh,
      aligned.gridExportCoverage,
      resolveForcedCapacityKWh(body.forcedCapacityKWh),
    );

    const warnings = [
      describePartialFailures(lang, 'consumption', consumption.diagnostics),
      describePartialFailures(lang, 'production', production.diagnostics),
      gridExportDiagnostics ? describePartialFailures(lang, 'gridExport', gridExportDiagnostics) : null,
    ].filter((w): w is string => w !== null);

    res.json({ ...result, warnings: warnings.length > 0 ? warnings : undefined });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
