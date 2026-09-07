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
import { useTranslation } from '../i18n/context';
import { StatTile } from './StatTile';
import type { IntervalSeriesData } from '../types';

interface Props {
  intervalSeries: IntervalSeriesData;
}

function dayKeyOf(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** dayKeyOf already produces YYYY-MM-DD; just swap the separator for the fixed YYYY.MM.DD display format. */
function dayLabelOf(key: string): string {
  return key.replace(/-/g, '.');
}

export function DaySelectorChart({ intervalSeries }: Props) {
  const scheme = useColorScheme();
  const t = TOKENS[scheme];
  const { t: tr } = useTranslation();

  const LABELS: Record<string, string> = {
    socKWh: tr('charts.daySelector.seriesSoc'),
    totalProductionKWh: tr('charts.daySelector.seriesProduction'),
    gridExportKWh: tr('charts.daySelector.seriesGridExport'),
    gridImportKWh: tr('charts.daySelector.seriesGridImport'),
    batteryDischargeKWh: tr('charts.daySelector.seriesBatteryDischarge'),
    totalConsumptionKWh: tr('charts.daySelector.seriesTotalConsumption'),
  };

  const dayKeys = useMemo(() => {
    const seen = new Set<string>();
    for (const ts of intervalSeries.timestamps) seen.add(dayKeyOf(ts));
    return Array.from(seen).sort();
  }, [intervalSeries.timestamps]);

  const [selectedDay, setSelectedDay] = useState(() => dayKeys[Math.floor(dayKeys.length / 2)] ?? '');

  const { chartData, dayTotals } = useMemo(() => {
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

    const dayTotals = {
      consumptionKWh: 0,
      productionKWh: 0,
      gridImportKWh: 0,
      gridExportKWh: 0,
      batteryDischargeKWh: 0,
    };

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

      dayTotals.consumptionKWh += totalConsumptionKWh[i];
      dayTotals.productionKWh += totalProductionKWh[i];
      dayTotals.gridImportKWh += gridImportKWh[i];
      dayTotals.gridExportKWh += gridExportKWh[i];
      dayTotals.batteryDischargeKWh += batteryDischargeKWh[i];
    }

    const chartData = hours
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

    return { chartData, dayTotals };
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
      <h3>{tr('charts.daySelector.title')}</h3>
      <div className="field-row">
        <label className="field-label" htmlFor="day-selector">
          {tr('charts.daySelector.dayLabel')}
        </label>
        <select id="day-selector" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
          {dayKeys.map((key) => (
            <option key={key} value={key}>
              {dayLabelOf(key)}
            </option>
          ))}
        </select>
      </div>

      <div className="stat-grid day-summary">
        <StatTile label={tr('charts.daySelector.summaryConsumption')} value={`${dayTotals.consumptionKWh.toFixed(1)} kWh`} />
        <StatTile label={tr('charts.daySelector.summaryProduction')} value={`${dayTotals.productionKWh.toFixed(1)} kWh`} />
        <StatTile label={tr('charts.daySelector.summaryGridImport')} value={`${dayTotals.gridImportKWh.toFixed(1)} kWh`} />
        <StatTile label={tr('charts.daySelector.summaryGridExport')} value={`${dayTotals.gridExportKWh.toFixed(1)} kWh`} />
        <StatTile label={tr('charts.daySelector.summaryBatteryUsage')} value={`${dayTotals.batteryDischargeKWh.toFixed(1)} kWh`} />
      </div>

      <p className="muted" style={{ marginTop: 8, marginBottom: 8, fontSize: 13 }}>
        {tr('charts.daySelector.description')}
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
            formatter={(value: number, key: string) => [`${Math.abs(value).toFixed(3)} kWh`, LABELS[key] ?? key]}
          />
          <Legend
            formatter={(value: string) => LABELS[value] ?? value}
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
