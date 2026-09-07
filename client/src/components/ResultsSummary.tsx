import type { SimulationResponse } from '../types';
import { useTranslation } from '../i18n/context';
import { formatDateYMD } from '../dateFormat';
import { CapacitySelector } from './CapacitySelector';
import { StatTile } from './StatTile';

interface Props {
  result: SimulationResponse;
  sweepMaxKWh: number;
  onCapacityChange: (capacityKWh: number) => void;
  capacityChanging: boolean;
}

export function ResultsSummary({ result, sweepMaxKWh, onCapacityChange, capacityChanging }: Props) {
  const { t } = useTranslation();
  const { selected, recommendedCapacityKWh, meta } = result;
  const isRecommended = selected.capacityKWh === recommendedCapacityKWh;

  return (
    <div className="results-summary">
      <div className="hero-figure">
        <span className="hero-value">{selected.capacityKWh.toFixed(1)} kWh</span>
        <span className="hero-label">{t(isRecommended ? 'results.heroLabel' : 'results.selectedHeroLabel')}</span>
      </div>

      <CapacitySelector
        sweepMaxKWh={sweepMaxKWh}
        recommendedCapacityKWh={recommendedCapacityKWh}
        selectedCapacityKWh={selected.capacityKWh}
        onChange={onCapacityChange}
        disabled={capacityChanging}
      />

      <p className="reason-text">{selected.reason}</p>

      <div className="stat-grid">
        <StatTile label={t('results.exportReduction')} value={`${selected.exportReductionPct.toFixed(0)}%`} />
        <StatTile label={t('results.selfConsumption')} value={`${selected.selfConsumptionPct.toFixed(0)}%`} />
        <StatTile label={t('results.dailyCycles')} value={selected.dailyCycles.toFixed(2)} />
        <StatTile label={t('results.nightCoverage')} value={`${selected.nightCoveragePct.toFixed(0)}%`} />
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
