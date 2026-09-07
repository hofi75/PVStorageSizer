import { useState } from 'react';
import './App.css';
import { parseCsvFile, simulate } from './api';
import { FileUploadCard } from './components/FileUploadCard';
import { ParamsForm } from './components/ParamsForm';
import { ResultsSummary } from './components/ResultsSummary';
import { CapacityChart } from './components/CapacityChart';
import { DailyProfileChart } from './components/DailyProfileChart';
import { MonthlyNightChart } from './components/MonthlyNightChart';
import { MonthlyConsumptionChart } from './components/MonthlyConsumptionChart';
import { DaySelectorChart } from './components/DaySelectorChart';
import { distinctValues } from './components/ColumnMapper';
import { defaultParams } from './types';
import type { ColumnMapping, ParsedCsv, SimulationParams, SimulationResponse } from './types';

interface FileSlotState {
  fileName: string | null;
  parsed: ParsedCsv | null;
  mapping: ColumnMapping | null;
  loading: boolean;
  error: string | null;
}

const emptySlot: FileSlotState = { fileName: null, parsed: null, mapping: null, loading: false, error: null };

/**
 * A single meter export file often contains both consumption ("Vételezett") and
 * grid-export ("Visszatáplált") rows, distinguished only by a "type" column that the
 * consumption upload already filters on. When that's the case (exactly two distinct
 * values in the filter column), the grid-export series can be derived for free from
 * the same file/mapping - no separate upload needed.
 */
function deriveGridExportMapping(consumption: FileSlotState): { rows: string[][]; mapping: ColumnMapping } | null {
  const { parsed, mapping } = consumption;
  if (!parsed || !mapping || mapping.filterCol === null) return null;
  const values = distinctValues(parsed, mapping, mapping.filterCol);
  if (values.length !== 2) return null;
  const other = values.find((v) => v !== mapping.filterValue);
  if (!other) return null;
  return { rows: parsed.rows, mapping: { ...mapping, filterValue: other } };
}

function App() {
  const [consumption, setConsumption] = useState<FileSlotState>(emptySlot);
  const [production, setProduction] = useState<FileSlotState>(emptySlot);
  const [params, setParams] = useState<SimulationParams>(defaultParams());
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  const handleFileSelected = async (setSlot: (s: FileSlotState) => void, file: File) => {
    setSlot({ fileName: file.name, parsed: null, mapping: null, loading: true, error: null });
    try {
      const parsed = await parseCsvFile(file);
      setSlot({
        fileName: file.name,
        parsed,
        mapping: parsed.suggestedMapping,
        loading: false,
        error: null,
      });
    } catch (err) {
      setSlot({ fileName: file.name, parsed: null, mapping: null, loading: false, error: (err as Error).message });
    }
  };

  const canSimulate = Boolean(consumption.parsed && consumption.mapping && production.parsed && production.mapping);

  const handleSimulate = async () => {
    if (!consumption.parsed || !consumption.mapping || !production.parsed || !production.mapping) return;
    setSimLoading(true);
    setSimError(null);
    try {
      const res = await simulate(
        { rows: consumption.parsed.rows, mapping: consumption.mapping },
        { rows: production.parsed.rows, mapping: production.mapping },
        params,
        deriveGridExportMapping(consumption),
      );
      setResult(res);
    } catch (err) {
      setSimError((err as Error).message);
      setResult(null);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Akkumulátor méretező</h1>
        <p className="muted">
          Töltsd fel a negyedórás fogyasztási és napelemes termelési adataidat CSV-ben, és a rendszer megkeresi azt
          az akkumulátor kapacitást, amelynél a hálózatba visszatöltött energia a legkisebb, az akkumulátor
          kihasználtsága pedig még jó.
        </p>
      </header>

      <div className="upload-grid">
        <FileUploadCard
          idPrefix="consumption"
          title="1. Fogyasztási adatok"
          description={
            'Elektromos mérőóra negyedórás bontású CSV exportja. Ha a fájl a vételezett és a hálózatba ' +
            'visszatáplált energiát is tartalmazza (egy "típus" oszloppal megkülönböztetve), a rendszer a ' +
            'szűrőben nem választott másik értékből automatikusan levezeti a visszatáplálást is - külön ' +
            'fájlt nem kell feltölteni hozzá.'
          }
          fileName={consumption.fileName}
          parsed={consumption.parsed}
          mapping={consumption.mapping}
          loading={consumption.loading}
          error={consumption.error}
          onFileSelected={(f) => handleFileSelected(setConsumption, f)}
          onMappingChange={(m) => setConsumption((s) => ({ ...s, mapping: m }))}
        />
        <FileUploadCard
          idPrefix="production"
          title="2. Napelemes termelési adatok"
          description="Az inverter/monitoring rendszer termelési CSV exportja, ugyanarra a fogyasztási helyre."
          fileName={production.fileName}
          parsed={production.parsed}
          mapping={production.mapping}
          loading={production.loading}
          error={production.error}
          onFileSelected={(f) => handleFileSelected(setProduction, f)}
          onMappingChange={(m) => setProduction((s) => ({ ...s, mapping: m }))}
        />
      </div>

      <div className="card">
        <h2>3. Szimulációs paraméterek</h2>
        <ParamsForm params={params} onChange={setParams} />
      </div>

      <div className="action-row">
        <button className="primary-button" disabled={!canSimulate || simLoading} onClick={handleSimulate}>
          {simLoading ? 'Számítás…' : 'Számítás indítása'}
        </button>
        {simError && <p className="status error">{simError}</p>}
      </div>

      {result && (
        <div className="results">
          {result.warnings?.map((w, i) => (
            <div key={i} className="warning-box">
              {w}
            </div>
          ))}
          <ResultsSummary result={result} />
          <CapacityChart sweep={result.sweep} recommendedCapacityKWh={result.recommended.capacityKWh} />
          <DailyProfileChart dailyProfile={result.dailyProfile} />
          <DaySelectorChart intervalSeries={result.intervalSeries} />
          <MonthlyNightChart monthlyNightProfile={result.monthlyNightProfile} />
          {result.monthlyConsumptionProfile && (
            <MonthlyConsumptionChart monthlyConsumptionProfile={result.monthlyConsumptionProfile} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
