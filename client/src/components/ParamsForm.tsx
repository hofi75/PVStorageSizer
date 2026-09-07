import type { SimulationParams } from '../types';

interface Props {
  params: SimulationParams;
  onChange: (params: SimulationParams) => void;
}

export function ParamsForm({ params, onChange }: Props) {
  const set = <K extends keyof SimulationParams>(key: K, value: number) =>
    onChange({ ...params, [key]: value });

  return (
    <div className="params-form">
      <div className="param-field">
        <label htmlFor="eff">Kör-hatásfok (%)</label>
        <input
          id="eff"
          type="number"
          min={50}
          max={100}
          step={1}
          value={params.roundTripEfficiencyPct}
          onChange={(e) => set('roundTripEfficiencyPct', Number(e.target.value))}
        />
      </div>
      <div className="param-field">
        <label htmlFor="crate">Max töltő/kisütő teljesítmény (C-rate)</label>
        <input
          id="crate"
          type="number"
          min={0.1}
          max={5}
          step={0.1}
          value={params.maxPowerCRate}
          onChange={(e) => set('maxPowerCRate', Number(e.target.value))}
        />
      </div>
      <div className="param-field">
        <label htmlFor="reserve">Minimális töltöttségi szint (%)</label>
        <input
          id="reserve"
          type="number"
          min={0}
          max={50}
          step={1}
          value={params.minSocReservePct}
          onChange={(e) => set('minSocReservePct', Number(e.target.value))}
        />
      </div>
      <div className="param-field">
        <label htmlFor="sweepMin">Vizsgált kapacitás tartomány (kWh)</label>
        <div className="range-inputs">
          <input
            id="sweepMin"
            type="number"
            min={0}
            max={params.sweepMaxKWh}
            step={0.5}
            value={params.sweepMinKWh}
            onChange={(e) => set('sweepMinKWh', Number(e.target.value))}
          />
          <span>–</span>
          <input
            type="number"
            min={params.sweepMinKWh}
            max={100}
            step={0.5}
            value={params.sweepMaxKWh}
            onChange={(e) => set('sweepMaxKWh', Number(e.target.value))}
          />
        </div>
      </div>
      <div className="param-field">
        <label htmlFor="sweepStep">Lépésköz (kWh)</label>
        <input
          id="sweepStep"
          type="number"
          min={0.1}
          max={5}
          step={0.1}
          value={params.sweepStepKWh}
          onChange={(e) => set('sweepStepKWh', Number(e.target.value))}
        />
      </div>
    </div>
  );
}
