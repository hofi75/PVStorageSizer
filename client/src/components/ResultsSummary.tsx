import type { SimulationResponse } from '../types';

interface Props {
  result: SimulationResponse;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function ResultsSummary({ result }: Props) {
  const { recommended, meta } = result;

  return (
    <div className="results-summary">
      <div className="hero-figure">
        <span className="hero-value">{recommended.capacityKWh.toFixed(1)} kWh</span>
        <span className="hero-label">javasolt akkumulátor kapacitás</span>
      </div>
      <p className="reason-text">{recommended.reasonHu}</p>

      <div className="stat-grid">
        <StatTile label="Export csökkenés" value={`${recommended.exportReductionPct.toFixed(0)}%`} />
        <StatTile label="Napi termelés önfogyasztása" value={`${recommended.selfConsumptionPct.toFixed(0)}%`} />
        <StatTile label="Átlagos napi ciklusszám" value={recommended.dailyCycles.toFixed(2)} />
        <StatTile label="Éjszakai fogyasztás fedezettsége" value={`${recommended.nightCoveragePct.toFixed(0)}%`} />
      </div>

      <p className="muted meta-line">
        Elemzett időszak: {new Date(meta.rangeStartIso).toLocaleDateString('hu-HU')} –{' '}
        {new Date(meta.rangeEndIso).toLocaleDateString('hu-HU')} ({meta.days.toFixed(0)} nap) · összesen{' '}
        {meta.totalConsumptionKWh.toFixed(0)} kWh fogyasztás, {meta.totalProductionKWh.toFixed(0)} kWh termelés
      </p>
    </div>
  );
}
