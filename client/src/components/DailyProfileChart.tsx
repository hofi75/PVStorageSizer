import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useColorScheme, TOKENS } from '../palette';
import { useTranslation } from '../i18n/context';
import type { DailyProfilePoint } from '../types';

interface Props {
  dailyProfile: DailyProfilePoint[];
}

export function DailyProfileChart({ dailyProfile }: Props) {
  const scheme = useColorScheme();
  const t = TOKENS[scheme];
  const { t: tr } = useTranslation();

  const LABELS: Record<string, string> = {
    avgProductionKWh: tr('charts.dailyProfile.seriesProduction'),
    avgConsumptionKWh: tr('charts.dailyProfile.seriesConsumption'),
    avgSoCKWh: tr('charts.dailyProfile.seriesSoc'),
    netGrid: tr('charts.dailyProfile.seriesNetGrid'),
  };

  const gridData = dailyProfile.map((p) => ({
    label: p.label,
    netGrid: p.avgGridImportKWh - p.avgGridExportKWh,
  }));
  const gridMax = Math.max(0.001, ...gridData.map((d) => d.netGrid));
  const gridMin = Math.min(-0.001, ...gridData.map((d) => d.netGrid));
  const zeroOffset = gridMax / (gridMax - gridMin);

  const tooltipStyle = {
    background: t.surface,
    border: `1px solid ${t.gridline}`,
    color: t.textPrimary,
    fontSize: 13,
  };
  const tickEvery = Math.max(1, Math.floor(dailyProfile.length / 12));

  return (
    <div className="chart-grid">
      <div className="chart-card">
        <h3>{tr('charts.dailyProfile.title1')}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={dailyProfile} margin={{ top: 10, right: 24, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={t.gridline} vertical={false} />
            <XAxis
              dataKey="label"
              stroke={t.baseline}
              tick={{ fill: t.muted, fontSize: 11 }}
              interval={tickEvery}
            />
            <YAxis
              stroke={t.baseline}
              tick={{ fill: t.muted, fontSize: 12 }}
              width={44}
              tickFormatter={(v) => `${v} kWh`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, key: string) => [`${value.toFixed(2)} kWh`, LABELS[key] ?? key]}
            />
            <Legend
              formatter={(value: string) => LABELS[value] ?? value}
              wrapperStyle={{ color: t.textSecondary, fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="avgProductionKWh"
              name="avgProductionKWh"
              stroke={t.series.production}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="avgConsumptionKWh"
              name="avgConsumptionKWh"
              stroke={t.series.consumption}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="avgSoCKWh"
              name="avgSoCKWh"
              stroke={t.series.soc}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>{tr('charts.dailyProfile.title2')}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={gridData} margin={{ top: 10, right: 24, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="gridSplitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset={0} stopColor={t.diverging.positive} stopOpacity={0.25} />
                <stop offset={zeroOffset} stopColor={t.diverging.positive} stopOpacity={0.05} />
                <stop offset={zeroOffset} stopColor={t.diverging.negative} stopOpacity={0.05} />
                <stop offset={1} stopColor={t.diverging.negative} stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="gridSplitLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset={0} stopColor={t.diverging.positive} />
                <stop offset={zeroOffset} stopColor={t.diverging.positive} />
                <stop offset={zeroOffset} stopColor={t.diverging.negative} />
                <stop offset={1} stopColor={t.diverging.negative} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={t.gridline} vertical={false} />
            <XAxis
              dataKey="label"
              stroke={t.baseline}
              tick={{ fill: t.muted, fontSize: 11 }}
              interval={tickEvery}
            />
            <YAxis
              stroke={t.baseline}
              tick={{ fill: t.muted, fontSize: 12 }}
              width={44}
              tickFormatter={(v) => `${v} kWh`}
            />
            <ReferenceLine y={0} stroke={t.baseline} strokeWidth={1} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => {
                const dir = value >= 0 ? tr('charts.dailyProfile.import') : tr('charts.dailyProfile.export');
                return [`${Math.abs(value).toFixed(2)} kWh (${dir})`, tr('charts.dailyProfile.seriesNetGrid')];
              }}
            />
            <Area
              type="monotone"
              dataKey="netGrid"
              stroke="none"
              fill="url(#gridSplitFill)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="netGrid"
              stroke="url(#gridSplitLine)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
