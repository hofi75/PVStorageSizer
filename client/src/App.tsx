import { useEffect, useState } from 'react';
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
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useTranslation } from './i18n/context';
import { loadStoredParams, saveParams } from './types';
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
 * A single meter export file often contains both grid-usage ("Vételezett") and
 * grid-backfeed ("Visszatáplált") rows, distinguished only by a "type" column - the
 * grid-data upload filters to the usage value via filterCol/filterValue, and separately
 * names the backfeed value via gridBackfeedValue (auto-detected, editable in the column
 * mapper). When set, the backfeed series is derived for free from this same file/column
 * instead of requiring a separate upload.
 */
function deriveGridExportMapping(consumption: FileSlotState): { rows: string[][]; mapping: ColumnMapping } | null {
  const { parsed, mapping } = consumption;
  if (!parsed || !mapping || mapping.filterCol === null || !mapping.gridBackfeedValue) return null;
  return { rows: parsed.rows, mapping: { ...mapping, filterValue: mapping.gridBackfeedValue } };
}

function App() {
  const { lang, t } = useTranslation();
  const [consumption, setConsumption] = useState<FileSlotState>(emptySlot);
  const [production, setProduction] = useState<FileSlotState>(emptySlot);
  const [params, setParams] = useState<SimulationParams>(loadStoredParams);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [capacityChanging, setCapacityChanging] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    saveParams(params);
  }, [params]);

  const handleFileSelected = async (setSlot: (s: FileSlotState) => void, file: File) => {
    setSlot({ fileName: file.name, parsed: null, mapping: null, loading: true, error: null });
    try {
      const parsed = await parseCsvFile(file, lang);
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

  /** Runs (or reruns) the simulation. Returns whether it succeeded, so callers can
   *  decide what to do with any previously-shown result on failure. */
  const runSimulate = async (forcedCapacityKWh?: number): Promise<boolean> => {
    if (!consumption.parsed || !consumption.mapping || !production.parsed || !production.mapping) return false;
    setSimError(null);
    try {
      const res = await simulate(
        { rows: consumption.parsed.rows, mapping: consumption.mapping },
        { rows: production.parsed.rows, mapping: production.mapping },
        params,
        deriveGridExportMapping(consumption),
        lang,
        forcedCapacityKWh,
      );
      setResult(res);
      return true;
    } catch (err) {
      setSimError((err as Error).message);
      return false;
    }
  };

  const handleSimulate = async () => {
    setSimLoading(true);
    const ok = await runSimulate();
    if (!ok) setResult(null);
    setSimLoading(false);
  };

  /** Reruns just the detailed stats/charts for a battery size the user picked from the
   *  dropdown - reuses the already-uploaded files, no new upload needed. Keeps showing
   *  the previous result if the recompute fails, rather than clearing the whole panel. */
  const handleCapacityChange = async (capacityKWh: number) => {
    setCapacityChanging(true);
    await runSimulate(capacityKWh);
    setCapacityChanging(false);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-row">
          <h1>{t('app.title')}</h1>
          <LanguageSwitcher />
        </div>
        <p className="muted">{t('app.subtitle')}</p>
      </header>

      <div className="upload-grid">
        <FileUploadCard
          idPrefix="consumption"
          title={t('upload.grid.title')}
          description={t('upload.grid.description')}
          showGridBackfeedFilter
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
          title={t('upload.production.title')}
          description={t('upload.production.description')}
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
        <h2>{t('params.sectionTitle')}</h2>
        <ParamsForm params={params} onChange={setParams} />
      </div>

      <div className="action-row">
        <button className="primary-button" disabled={!canSimulate || simLoading} onClick={handleSimulate}>
          {simLoading ? t('action.simulating') : t('action.simulate')}
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
          <ResultsSummary
            result={result}
            sweepMaxKWh={params.sweepMaxKWh}
            onCapacityChange={handleCapacityChange}
            capacityChanging={capacityChanging}
          />
          <CapacityChart sweep={result.sweep} recommendedCapacityKWh={result.recommendedCapacityKWh} />
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
