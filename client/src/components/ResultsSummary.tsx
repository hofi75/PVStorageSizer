import type { SimulationResponse } from '../types';
import { useTranslation } from '../i18n/context';
import { formatDateYMD } from '../dateFormat';

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
  const { t } = useTranslation();
  const { recommended, meta } = result;

  return (
    <div className="results-summary">
      <div className="hero-figure">
        <span className="hero-value">{recommended.capacityKWh.toFixed(1)} kWh</span>
        <span className="hero-label">{t('results.heroLabel')}</span>
      </div>
      <p className="reason-text">{recommended.reason}</p>

      <div className="stat-grid">
        <StatTile label={t('results.exportReduction')} value={`${recommended.exportReductionPct.toFixed(0)}%`} />
        <StatTile
          label={t('results.selfConsumption')}
          value={`${recommended.selfConsumptionPct.toFixed(0)}%`}
        />
        <StatTile label={t('results.dailyCycles')} value={recommended.dailyCycles.toFixed(2)} />
        <StatTile
          label={t('results.nightCoverage')}
          value={`${recommended.nightCoveragePct.toFixed(0)}%`}
        />
      </div>

      <p className="muted meta-line">
        {t('results.metaLine', {
          start: formatDateYMD(meta.rangeStartIso),
          end: formatDateYMD(meta.rangeEndIso),
          days: meta.days.toFixed(0),
          consumption: meta.totalConsumptionKWh.toFixed(0),
          production: meta.totalProductionKWh.toFixed(0),
        })}
      </p>
    </div>
  );
}
