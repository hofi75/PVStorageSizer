import { useTranslation } from '../i18n/context';

interface Props {
  sweepMaxKWh: number;
  recommendedCapacityKWh: number;
  selectedCapacityKWh: number;
  onChange: (capacityKWh: number) => void;
  disabled: boolean;
}

const STEP_KWH = 0.5;

/** 0, 0.5, 1.0, ... up to the sweep ceiling, plus the recommended/selected capacities
 *  themselves in case either isn't already a multiple of 0.5. */
function buildOptions(maxKWh: number, mustInclude: number[]): number[] {
  const upperKWh = Math.max(maxKWh, ...mustInclude);
  const stepCount = Math.round(upperKWh / STEP_KWH);
  const options = new Set<number>();
  for (let i = 0; i <= stepCount; i++) options.add(i * STEP_KWH);
  for (const v of mustInclude) options.add(Math.round(v * 10) / 10);
  return Array.from(options).sort((a, b) => a - b);
}

export function CapacitySelector({
  sweepMaxKWh,
  recommendedCapacityKWh,
  selectedCapacityKWh,
  onChange,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const options = buildOptions(sweepMaxKWh, [recommendedCapacityKWh, selectedCapacityKWh]);

  return (
    <div className="field-row capacity-selector">
      <label className="field-label" htmlFor="capacity-select">
        {t('results.capacitySelectLabel')}
      </label>
      <select
        id="capacity-select"
        value={selectedCapacityKWh}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((v) => (
          <option key={v} value={v}>
            {v.toFixed(1)} kWh{v === recommendedCapacityKWh ? ` (${t('charts.capacity.recommended')})` : ''}
          </option>
        ))}
      </select>
      {selectedCapacityKWh !== recommendedCapacityKWh && (
        <button
          type="button"
          className="link-button"
          disabled={disabled}
          onClick={() => onChange(recommendedCapacityKWh)}
        >
          {t('results.resetToRecommended')}
        </button>
      )}
      {disabled && <span className="hint">{t('results.recalculating')}</span>}
    </div>
  );
}
