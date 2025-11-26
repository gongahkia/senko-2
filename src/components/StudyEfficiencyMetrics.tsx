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
        <p className="text-xs sm:text-sm text-muted-foreground">
          Performance metrics and productivity insights
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Cards Per Minute */}
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <p className="text-xs font-medium text-muted-foreground">Cards/Min</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {cardsPerMinute.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {cardsPerMinute < 1 && 'Take your time'}
            {cardsPerMinute >= 1 && cardsPerMinute < 2 && 'Good pace'}
            {cardsPerMinute >= 2 && cardsPerMinute < 3 && 'Great speed!'}
            {cardsPerMinute >= 3 && 'Lightning fast!'}
          </p>
        </div>

        {/* Average Time Per Card */}
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-medium text-muted-foreground">Avg Time</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {formatTimePerCard(averageTimePerCard)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">per card</p>
        </div>

        {/* Peak Hour */}
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <p className="text-xs font-medium text-muted-foreground">Peak Hour</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {peakHour !== null ? formatHour(peakHour) : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {peakHour !== null ? 'Most productive' : 'Keep studying'}
          </p>
        </div>

        {/* Total Study Time */}
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-purple-500" />
            <p className="text-xs font-medium text-muted-foreground">Total Time</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">
            {formatDuration(totalStudyTime)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalStudyTime < 60 && 'Getting started'}
            {totalStudyTime >= 60 && totalStudyTime < 300 && 'Good progress'}
            {totalStudyTime >= 300 && totalStudyTime < 1000 && 'Impressive!'}
            {totalStudyTime >= 1000 && 'Master level!'}
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="border rounded-lg p-3 sm:p-4 bg-muted/30">
        <p className="text-sm font-medium mb-2">💡 Productivity Insights</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {cardsPerMinute > 0 && cardsPerMinute < 1.5 && (
            <li>• Consider increasing your review speed for better efficiency</li>
          )}
          {cardsPerMinute >= 2.5 && (
            <li>• Great pace! Make sure you're still absorbing the material</li>
          )}
          {peakHour !== null && (
            <li>• You're most productive at {formatHour(peakHour)}. Schedule important study sessions then!</li>
          )}
          {averageTimePerCard > 60 && (
            <li>• Spending a lot of time per card. Break down complex concepts into smaller pieces</li>
          )}
          {totalStudyTime >= 300 && (
            <li>• Excellent dedication! {formatDuration(totalStudyTime)} of focused study time</li>
          )}
        </ul>
      </div>
    </div>
  );
}
