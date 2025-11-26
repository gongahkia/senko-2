import { useMemo } from 'react';
import { loadAppData, loadDailyStats } from '@/services/storage';
import { ActivityHeatmap } from './ActivityHeatmap';
import { StreakDisplay } from './StreakDisplay';
import { RetentionCurve } from './RetentionCurve';
import { DeckDifficulty } from './DeckDifficulty';
import { StudyEfficiencyMetrics } from './StudyEfficiencyMetrics';
import {
  calculateStreak,
  generateHeatmapData,
  calculateRetentionCurve,
  calculateStudyEfficiency,
} from '@/lib/statistics';
import { DeckStats } from '@/types';

export function AdvancedStatistics() {
  const stats = useMemo(() => {
    const data = loadAppData();
    const dailyStats = loadDailyStats();

    // Calculate all analytics
    const streakData = calculateStreak(dailyStats);
    const heatmapData = generateHeatmapData(dailyStats, 365);
    const retentionData = calculateRetentionCurve(data.sessions);
    const efficiencyData = calculateStudyEfficiency(data.sessions, dailyStats);

    // Calculate deck stats for difficulty analysis
    const deckStats: DeckStats[] = data.decks.map((deck) => {
      const deckSessions = data.sessions.filter((s) => s.deckId === deck.id);
      const totalRatings =
        deckSessions.reduce(
          (sum, s) => sum + s.ratings[1] + s.ratings[2] + s.ratings[3] + s.ratings[4],
          0
        );
      const weightedSum = deckSessions.reduce(
        (sum, s) =>
          sum +
          s.ratings[1] * 1 +
          s.ratings[2] * 2 +
          s.ratings[3] * 3 +
          s.ratings[4] * 4,
        0
      );
      const avgRating = totalRatings > 0 ? weightedSum / totalRatings : 0;

      return {
        deckId: deck.id,
        deckName: deck.name,
        totalCards: deck.questions.length,
        masteredCards: 0,
        learningCards: 0,
        unseenCards: deck.questions.length,
        averageRating: avgRating,
        totalReviews: totalRatings,
      };
    });

    return {
      streakData,
      heatmapData,
      retentionData,
      efficiencyData,
      deckStats,
      hasData: data.sessions.length > 0 || dailyStats.length > 0,
    };
  }, []);

  if (!stats.hasData) {
    return (
      <div className="border rounded-lg p-8 bg-muted/30 text-center">
        <p className="text-lg font-medium text-muted-foreground mb-2">
          No analytics data yet
        </p>
        <p className="text-sm text-muted-foreground">
          Start studying to unlock detailed insights about your learning progress!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Advanced Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Deep insights into your study patterns and performance
        </p>
      </div>

      {/* Streaks */}
      <div>
        <StreakDisplay streakData={stats.streakData} />
      </div>

      {/* Activity Heatmap */}
      <div className="border rounded-lg p-4 sm:p-6 bg-card">
        <h3 className="text-base sm:text-lg font-semibold mb-3">Study Activity Calendar</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          Your daily review activity over the past year
        </p>
        <ActivityHeatmap data={stats.heatmapData} daysBack={365} />
      </div>

      {/* Study Efficiency Metrics */}
      <div className="border rounded-lg p-4 sm:p-6 bg-card">
        <StudyEfficiencyMetrics efficiency={stats.efficiencyData} />
      </div>

      {/* Retention Curve */}
      {stats.retentionData.length > 0 && (
        <div className="border rounded-lg p-4 sm:p-6 bg-card">
          <RetentionCurve data={stats.retentionData} />
        </div>
      )}

      {/* Deck Difficulty */}
      {stats.deckStats.length > 0 && (
        <div className="border rounded-lg p-4 sm:p-6 bg-card">
          <DeckDifficulty deckStats={stats.deckStats} />
        </div>
      )}

      {/* Footer Note */}
      <div className="border-t pt-4">
        <p className="text-xs text-muted-foreground text-center">
          💡 Analytics update in real-time as you study. Keep reviewing to see your progress!
        </p>
      </div>
    </div>
  );
}
