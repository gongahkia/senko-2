import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RetentionPoint } from '@/types';

interface RetentionCurveProps {
  data: RetentionPoint[];
}

export function RetentionCurve({ data }: RetentionCurveProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Not enough data to show retention curve. Keep studying to see your progress!</p>
      </div>
    );
  }

  // Format data for recharts
  const chartData = data.map(point => ({
    days: point.daysSinceReview,
    retention: Math.round(point.retentionRate * 100),
    sampleSize: point.sampleSize,
  }));

  return (
    <div className="w-full">
      <div className="mb-3">
        <h3 className="text-base sm:text-lg font-semibold mb-1">Memory Retention Over Time</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Percentage of cards still remembered after review
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="days"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            label={{ value: 'Days Since Review', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            label={{ value: 'Retention %', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              color: 'hsl(var(--popover-foreground))',
            }}
            labelFormatter={(value) => `Day ${value}`}
            formatter={(value: number, name: string) => {
              if (name === 'retention') return [`${value}%`, 'Retention'];
              if (name === 'sampleSize') return [value, 'Cards'];
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value) => {
              if (value === 'retention') return 'Retention Rate';
              if (value === 'sampleSize') return 'Sample Size';
              return value;
            }}
          />
          <Line
            type="monotone"
            dataKey="retention"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="sampleSize"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 text-xs text-muted-foreground">
        <p>💡 Tip: The retention curve shows how well you remember cards over time. Regular review helps maintain high retention.</p>
      </div>
    </div>
  );
}
