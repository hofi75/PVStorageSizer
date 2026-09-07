import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useColorScheme, TOKENS } from '../palette';
import type { IntervalSeriesData } from '../types';

interface Props {
  intervalSeries: IntervalSeriesData;
}

const HU_LABELS: Record<string, string> = {
  socKWh: 'Akkumulátor töltöttség',
  totalProductionKWh: 'Aktuális termelés',
  gridExportKWh: 'Aktuális visszatáplálás',
  gridImportKWh: 'Aktuális fogyasztás hálózatról',
  batteryDischargeKWh: 'Aktuális fogyasztás akkumulátorról',
  totalConsumptionKWh: 'Összes fogyasztás',
};

function dayKeyOf(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabelOf(key: string): string {
  const [y, m, d] = key.split('-');
  return `${y}. ${m}. ${d}.`;
}

export function DaySelectorChart({ intervalSeries }: Props) {
  const scheme = useColorScheme();
  const t = TOKENS[scheme];

  const dayKeys = useMemo(() => {
    const seen = new Set<string>();
    for (const ts of intervalSeries.timestamps) seen.add(dayKeyOf(ts));
    return Array.from(seen).sort();
  }, [intervalSeries.timestamps]);

  const [selectedDay, setSelectedDay] = useState(() => dayKeys[Math.floor(dayKeys.length / 2)] ?? '');

  const chartData = useMemo(() => {
    const {
      timestamps,
      socKWh,
      gridExportKWh,
      gridImportKWh,
      batteryDischargeKWh,
      totalConsumptionKWh,
      totalProductionKWh,
    } = intervalSeries;

    // Sum the per-interval flows and average the SoC (a level, not a flow) within each hour.
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      socSum: 0,
      socCount: 0,
      gridExportKWh: 0,
      gridImportKWh: 0,
      batteryDischargeKWh: 0,
      totalConsumptionKWh: 0,
      totalProductionKWh: 0,
    }));

    for (let i = 0; i < timestamps.length; i++) {
      if (dayKeyOf(timestamps[i]) !== selectedDay) continue;
      const h = hours[new Date(timestamps[i]).getHours()];
      h.socSum += socKWh[i];
      h.socCount += 1;
      h.gridExportKWh += gridExportKWh[i];
      h.gridImportKWh += gridImportKWh[i];
      h.batteryDischargeKWh += batteryDischargeKWh[i];
      h.totalConsumptionKWh += totalConsumptionKWh[i];
      h.totalProductionKWh += totalProductionKWh[i];
    }

    return hours
      .filter((h) => h.socCount > 0)
      .map((h) => ({
        label: `${String(h.hour).padStart(2, '0')}:00`,
        socKWh: h.socSum / h.socCount,
        gridExportKWh: h.gridExportKWh,
        gridImportKWh: -h.gridImportKWh,
        batteryDischargeKWh: -h.batteryDischargeKWh,
        totalConsumptionKWh: -h.totalConsumptionKWh,
        totalProductionKWh: h.totalProductionKWh,
      }));
  }, [intervalSeries, selectedDay]);

  if (dayKeys.length === 0) return null;

  const tooltipStyle = {
    background: t.surface,
    border: `1px solid ${t.gridline}`,
    color: t.textPrimary,
    fontSize: 13,
  };

  return (
    <div className="chart-card">
      <h3>Napi menetrend (kiválasztható nap, órás bontásban)</h3>
      <div className="field-row">
        <label className="field-label" htmlFor="day-selector">
          Nap
        </label>
        <select id="day-selector" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
          {dayKeys.map((key) => (
            <option key={key} value={key}>
              {dayLabelOf(key)}
            </option>
          ))}
        </select>
      </div>
      <p className="muted" style={{ marginTop: 8, marginBottom: 8, fontSize: 13 }}>
        A fogyasztás mindig lent (negatív), a visszatáplálás és a töltöttség fent (pozitív) látható. Az órán belüli
        adatok összegezve (töltöttségnél átlagolva) jelennek meg.
      </p>
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 24, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={t.gridline} vertical={false} />
          <XAxis dataKey="label" stroke={t.baseline} tick={{ fill: t.muted, fontSize: 11 }} />
          <YAxis
            stroke={t.baseline}
            tick={{ fill: t.muted, fontSize: 12 }}
            width={48}
            tickFormatter={(v) => `${Math.abs(v)} kWh`}
          />
          <ReferenceLine y={0} stroke={t.baseline} strokeWidth={1} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, key: string) => [`${Math.abs(value).toFixed(3)} kWh`, HU_LABELS[key] ?? key]}
          />
          <Legend
            formatter={(value: string) => HU_LABELS[value] ?? value}
            wrapperStyle={{ color: t.textSecondary, fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="totalProductionKWh"
            name="totalProductionKWh"
            stroke={t.series.production}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="gridExportKWh"
            name="gridExportKWh"
            stroke={t.series.gridExport}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="totalConsumptionKWh"
            name="totalConsumptionKWh"
            stroke={t.series.consumption}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="gridImportKWh"
            name="gridImportKWh"
            stroke={t.series.gridImport}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="batteryDischargeKWh"
            name="batteryDischargeKWh"
            stroke={t.series.soc}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="socKWh"
            name="socKWh"
            stroke={t.series.soc}
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
