import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useColorScheme, TOKENS } from '../palette';
import type { MonthlyNightPoint } from '../types';

interface Props {
  monthlyNightProfile: MonthlyNightPoint[];
}

const HU_LABELS: Record<string, string> = {
  avgNightConsumptionKWh: 'Átlagos éjszakai fogyasztás',
  avgNightStartSoCKWh: 'Átlagos töltöttség éjszaka elején',
};

export function MonthlyNightChart({ monthlyNightProfile }: Props) {
  const scheme = useColorScheme();
  const t = TOKENS[scheme];

  if (monthlyNightProfile.length === 0) return null;

  const tooltipStyle = {
    background: t.surface,
    border: `1px solid ${t.gridline}`,
    color: t.textPrimary,
    fontSize: 13,
  };

  const byMonth = new Map(monthlyNightProfile.map((p) => [p.label, p]));

  return (
    <div className="chart-grid">
      <div className="chart-card">
        <h3>Havi átlagos éjszakai fogyasztás és kezdő akku-töltöttség</h3>
        <p className="muted" style={{ marginTop: -4, marginBottom: 8, fontSize: 13 }}>
          Az éjszaka a nap utolsó termelt intervallumától a következő nap első termelt intervallumáig tart.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyNightProfile} margin={{ top: 10, right: 24, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={t.gridline} vertical={false} />
            <XAxis dataKey="label" stroke={t.baseline} tick={{ fill: t.muted, fontSize: 11 }} />
            <YAxis
              stroke={t.baseline}
              tick={{ fill: t.muted, fontSize: 12 }}
              width={44}
              tickFormatter={(v) => `${v} kWh`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, key: string) => [`${value.toFixed(2)} kWh`, HU_LABELS[key] ?? key]}
              labelFormatter={(label: string) => {
                const p = byMonth.get(label);
                return p ? `${label} (${p.nightsCount} éjszaka)` : label;
              }}
            />
            <Legend
              formatter={(value: string) => HU_LABELS[value] ?? value}
              wrapperStyle={{ color: t.textSecondary, fontSize: 12 }}
            />
            <Bar
              dataKey="avgNightConsumptionKWh"
              name="avgNightConsumptionKWh"
              fill={t.series.consumption}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="avgNightStartSoCKWh"
              name="avgNightStartSoCKWh"
              fill={t.series.soc}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
