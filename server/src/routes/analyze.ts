import { Router } from 'express';
import multer from 'multer';
import { parseCsvBuffer } from '../csv/parseCsv.js';
import { alignSeries, rowsToEnergyIntervals } from '../simulation/resample.js';
import type { RowParseDiagnostics } from '../simulation/resample.js';
import { runSimulation } from '../simulation/optimize.js';
import type { FileMappingInput, SimulationParams } from '../simulation/types.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

export const analyzeRouter = Router();

analyzeRouter.post('/parse-csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nem érkezett fájl.' });
    return;
  }
  try {
    const parsed = parseCsvBuffer(req.file.buffer);
    if (parsed.rows.length === 0) {
      res.status(400).json({ error: 'A CSV fájl üres, vagy nem sikerült beolvasni.' });
      return;
    }
    res.json(parsed);
  } catch (err) {
    res.status(400).json({ error: `A CSV feldolgozása sikertelen: ${(err as Error).message}` });
  }
});

interface SimulateRequestBody {
  consumption: FileMappingInput;
  production: FileMappingInput;
  gridExport?: FileMappingInput;
  params: SimulationParams;
}

function formatSampleRows(d: RowParseDiagnostics): string {
  if (d.sampleFailedRows.length === 0) return '';
  const lines = d.sampleFailedRows.map(
    (s) => `  - ${s.line}. sor (${s.reason === 'timestamp' ? 'időbélyeg' : 'érték'} hiba): ${s.row.join(';')}`,
  );
  return `\nPélda sikertelen sorokra:\n${lines.join('\n')}`;
}

function describeEmptyResult(label: string, d: RowParseDiagnostics): string {
  const parts: string[] = [];
  if (d.filteredOut > 0) parts.push(`${d.filteredOut} sor a szűrő miatt lett kizárva`);
  if (d.timestampParseFailed > 0) parts.push(`${d.timestampParseFailed} sornál nem sikerült az időbélyeget feldolgozni (rossz oszlop vagy dátumformátum?)`);
  if (d.valueParseFailed > 0) parts.push(`${d.valueParseFailed} sornál nem sikerült az értéket számként beolvasni (rossz oszlop?)`);
  const detail = parts.length > 0 ? ` Részletek: ${d.totalDataRows} adatsorból ${parts.join(', ')}.` : ` (${d.totalDataRows} adatsor volt, de egy sem illett a hozzárendelésre.)`;
  return `A ${label} CSV oszlop-hozzárendelésével nem sikerült érvényes adatot kinyerni. Ellenőrizd az oszlopokat és a dátumformátumot.${detail}${formatSampleRows(d)}`;
}

/** For a data source where parsing mostly succeeded, still flag any rows that were silently skipped
 *  or had their value replaced due to a missing-data marker. */
function describePartialFailures(label: string, d: RowParseDiagnostics): string | null {
  const messages: string[] = [];

  if (d.timestampParseFailed > 0 || d.valueParseFailed > 0) {
    const parts: string[] = [];
    if (d.timestampParseFailed > 0) parts.push(`${d.timestampParseFailed} sornál az időbélyeg`);
    if (d.valueParseFailed > 0) parts.push(`${d.valueParseFailed} sornál az érték`);
    messages.push(
      `A ${label} CSV-ben ${parts.join(', ')} feldolgozása nem sikerült, ezek a sorok kimaradtak a számításból.` +
        formatSampleRows(d),
    );
  }

  if (d.missingSubstituted > 0 || d.missingUnresolved > 0) {
    let msg = `A ${label} CSV-ben ${d.missingSubstituted} sornál jelzett a státusz oszlop hiányzó adatot - ezeknél egy korábbi nap azonos időpontbeli értékét használtuk.`;
    if (d.missingUnresolved > 0) {
      msg += ` ${d.missingUnresolved} esetben nem volt található korábbi (nem hiányzó) érték, ott az eredeti (valószínűleg érvénytelen) érték maradt.`;
    }
    messages.push(msg);
  }

  return messages.length > 0 ? messages.join('\n') : null;
}

function isFileMappingInput(v: unknown): v is FileMappingInput {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return Array.isArray(obj.rows) && typeof obj.mapping === 'object' && obj.mapping !== null;
}

analyzeRouter.post('/simulate', (req, res) => {
  const body = req.body as Partial<SimulateRequestBody>;

  if (!isFileMappingInput(body.consumption) || !isFileMappingInput(body.production) || !body.params) {
    res.status(400).json({ error: 'Hiányos kérés: fogyasztási adat, termelési adat vagy paraméterek hiányoznak.' });
    return;
  }

  try {
    const consumption = rowsToEnergyIntervals(body.consumption);
    const production = rowsToEnergyIntervals(body.production);

    if (consumption.intervals.length === 0) {
      res.status(400).json({ error: describeEmptyResult('fogyasztási', consumption.diagnostics) });
      return;
    }
    if (production.intervals.length === 0) {
      res.status(400).json({ error: describeEmptyResult('termelési', production.diagnostics) });
      return;
    }

    let gridExportIntervals: ReturnType<typeof rowsToEnergyIntervals>['intervals'] | null = null;
    let gridExportDiagnostics: RowParseDiagnostics | null = null;
    if (isFileMappingInput(body.gridExport)) {
      const gridExport = rowsToEnergyIntervals(body.gridExport);
      if (gridExport.intervals.length === 0) {
        res.status(400).json({ error: describeEmptyResult('hálózatba visszatáplált energia', gridExport.diagnostics) });
        return;
      }
      gridExportIntervals = gridExport.intervals;
      gridExportDiagnostics = gridExport.diagnostics;
    }

    const aligned = alignSeries(consumption.intervals, production.intervals, gridExportIntervals);
    const result = runSimulation(
      aligned.timestamps,
      aligned.consumptionKWh,
      aligned.productionKWh,
      aligned.intervalMinutes,
      body.params,
      aligned.gridExportKWh,
      aligned.gridExportCoverage,
    );

    const warnings = [
      describePartialFailures('fogyasztási', consumption.diagnostics),
      describePartialFailures('termelési', production.diagnostics),
      gridExportDiagnostics ? describePartialFailures('hálózatba visszatáplált energia', gridExportDiagnostics) : null,
    ].filter((w): w is string => w !== null);

    res.json({ ...result, warnings: warnings.length > 0 ? warnings : undefined });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
