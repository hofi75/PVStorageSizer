import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useColorScheme, TOKENS } from '../palette';
import type { MonthlyConsumptionPoint } from '../types';

interface Props {
  monthlyConsumptionProfile: MonthlyConsumptionPoint[];
}

const HU_LABELS: Record<string, string> = {
  totalSelfConsumedSolarKWh: 'Közvetlenül elfogyasztott napelemes energia',
  totalGridImportKWh: 'Hálózatból vételezett energia',
};

export function MonthlyConsumptionChart({ monthlyConsumptionProfile }: Props) {
  const scheme = useColorScheme();
  const t = TOKENS[scheme];

  if (monthlyConsumptionProfile.length === 0) return null;

  const tooltipStyle = {
    background: t.surface,
    border: `1px solid ${t.gridline}`,
    color: t.textPrimary,
    fontSize: 13,
  };

  const byMonth = new Map(monthlyConsumptionProfile.map((p) => [p.label, p]));

  return (
    <div className="chart-grid">
      <div className="chart-card">
        <h3>Havi valós háztartási fogyasztás (vételezés + termelés − visszatáplálás)</h3>
        <p className="muted" style={{ marginTop: -4, marginBottom: 8, fontSize: 13 }}>
          A hálózatból vételezett energia önmagában alábecsüli a tényleges fogyasztást, mert nem tartalmazza a
          napelemből közvetlenül (hálózat nélkül) elfogyasztott részt.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyConsumptionProfile} margin={{ top: 10, right: 24, bottom: 4, left: 4 }}>
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
              formatter={(value: number, key: string) => [`${value.toFixed(1)} kWh`, HU_LABELS[key] ?? key]}
              labelFormatter={(label: string) => {
                const p = byMonth.get(label);
                return p ? `${label} — összesen ${p.totalConsumptionKWh.toFixed(1)} kWh` : label;
              }}
            />
            <Legend
              formatter={(value: string) => HU_LABELS[value] ?? value}
              wrapperStyle={{ color: t.textSecondary, fontSize: 12 }}
            />
            <Bar
              dataKey="totalSelfConsumedSolarKWh"
              name="totalSelfConsumedSolarKWh"
              stackId="consumption"
              fill={t.series.production}
              radius={[0, 0, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="totalGridImportKWh"
              name="totalGridImportKWh"
              stackId="consumption"
              fill={t.series.consumption}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
