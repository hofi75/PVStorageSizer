import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useColorScheme, TOKENS } from '../palette';
import { useTranslation } from '../i18n/context';
import type { SweepPoint } from '../types';

interface Props {
  sweep: SweepPoint[];
  recommendedCapacityKWh: number;
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function CapacityChart({ sweep, recommendedCapacityKWh }: Props) {
  const scheme = useColorScheme();
  const t = TOKENS[scheme];
  const { t: tr } = useTranslation();
  const recommended = sweep.find((p) => p.capacityKWh === recommendedCapacityKWh);

  const tooltipStyle = {
    background: t.surface,
    border: `1px solid ${t.gridline}`,
    color: t.textPrimary,
    fontSize: 13,
  };

  return (
    <div className="chart-grid">
      <ChartCard title={tr('charts.capacity.title1')}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={sweep} margin={{ top: 10, right: 24, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={t.gridline} vertical={false} />
            <XAxis
              dataKey="capacityKWh"
              type="number"
              domain={[0, 'dataMax']}
              stroke={t.baseline}
              tick={{ fill: t.muted, fontSize: 12 }}
              tickFormatter={(v) => `${v} kWh`}
            />
            <YAxis
              stroke={t.baseline}
              tick={{ fill: t.muted, fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              width={44}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [`${value.toFixed(1)}%`, tr('results.exportReduction')]}
              labelFormatter={(v) => `${v} kWh`}
            />
            <Line
              type="monotone"
              dataKey="exportReductionPct"
              stroke={t.series.production}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            {recommended && (
              <ReferenceDot
                x={recommended.capacityKWh}
                y={recommended.exportReductionPct}
                r={6}
                fill={t.good}
                stroke={t.surface}
                strokeWidth={2}
                label={{ value: tr('charts.capacity.recommended'), position: 'top', fill: t.textSecondary, fontSize: 12 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={tr('charts.capacity.title2')}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={sweep} margin={{ top: 10, right: 24, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={t.gridline} vertical={false} />
            <XAxis
              dataKey="capacityKWh"
              type="number"
              domain={[0, 'dataMax']}
              stroke={t.baseline}
              tick={{ fill: t.muted, fontSize: 12 }}
              tickFormatter={(v) => `${v} kWh`}
            />
            <YAxis stroke={t.baseline} tick={{ fill: t.muted, fontSize: 12 }} width={44} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [`${value.toFixed(2)}`, tr('charts.capacity.dailyCycleTooltip')]}
              labelFormatter={(v) => `${v} kWh`}
            />
            <Line
              type="monotone"
              dataKey="dailyCycles"
              stroke={t.series.consumption}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            {recommended && (
              <ReferenceDot
                x={recommended.capacityKWh}
                y={recommended.dailyCycles}
                r={6}
                fill={t.good}
                stroke={t.surface}
                strokeWidth={2}
                label={{ value: tr('charts.capacity.recommended'), position: 'top', fill: t.textSecondary, fontSize: 12 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
