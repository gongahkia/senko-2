import { Clock, Zap, Target, TrendingUp } from 'lucide-react';
import { StudyEfficiency } from '@/types';
import { formatDuration, formatHour } from '@/lib/statistics';

interface StudyEfficiencyMetricsProps {
  efficiency: StudyEfficiency;
}

export function StudyEfficiencyMetrics({ efficiency }: StudyEfficiencyMetricsProps) {
  const { cardsPerMinute, averageTimePerCard, peakHour, totalStudyTime } = efficiency;

  const formatTimePerCard = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-1">Study Efficiency</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Cards Per Minute */}
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-medium text-muted-foreground">Cards/Min</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {cardsPerMinute.toFixed(1)}
          </p>
        </div>

        {/* Average Time Per Card */}
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-medium text-muted-foreground">Avg Time per Card</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {formatTimePerCard(averageTimePerCard)}
          </p>
        </div>

        {/* Peak Hour */}
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-medium text-muted-foreground">Most productive hour</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {peakHour !== null ? formatHour(peakHour) : 'N/A'}
          </p>
        </div>

        {/* Total Study Time */}
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-medium text-muted-foreground">Total Study Time</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {formatDuration(totalStudyTime)}
          </p>
        </div>
      </div>

      {/* Insights */}
    </div>
  );
}
