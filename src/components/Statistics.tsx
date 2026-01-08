import { useMemo } from "react";
import { loadAppData, loadDailyStats } from "@/services/storage";
import { DeckStats } from "@/types";
import { RetentionCurve } from "./RetentionCurve";
import { StudyEfficiencyMetrics } from "./StudyEfficiencyMetrics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  calculateRetentionCurve,
  calculateStudyEfficiency,
} from "@/lib/statistics";

export function Statistics() {
  // Calculate all stats in useMemo to avoid duplicate localStorage reads.
  // Previously, loadAppData() was called again during render for each deck,
  // causing N localStorage reads. Now deck names are stored in deckStats.
  const stats = useMemo(() => {
    const data = loadAppData();
    const dailyStats = loadDailyStats();

    // Calculate overall stats
    const totalDecks = data.decks.length;
    const totalCards = data.decks.reduce((sum, d) => sum + d.questions.length, 0);
    const totalSessions = data.sessions.length;

    const totalCardsReviewed = data.sessions.reduce(
      (sum, s) => sum + s.cardsReviewed,
      0
    );
    const totalCardsMastered = data.sessions.reduce(
      (sum, s) => sum + s.cardsMastered,
      0
    );

    // Calculate deck stats
    const deckStats: DeckStats[] = data.decks.map((deck) => {
      const deckSessions = data.sessions.filter((s) => s.deckId === deck.id);
      const totalReviews = deckSessions.reduce(
        (_sum, s) => s.ratings[1] + s.ratings[2] + s.ratings[3] + s.ratings[4],
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
      const avgRating = totalReviews > 0 ? weightedSum / totalReviews : 0;

      return {
        deckId: deck.id,
        deckName: deck.name,
        totalCards: deck.questions.length,
        masteredCards: 0, // Would need to track per-card state
        learningCards: 0,
        unseenCards: deck.questions.length,
        averageRating: avgRating,
        totalReviews,
      };
    });

    // Last 7 days stats
    const last7Days = dailyStats
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7)
      .reverse();

    // Calculate advanced analytics
    const retentionData = calculateRetentionCurve(data.sessions);
    const efficiencyData = calculateStudyEfficiency(data.sessions, dailyStats);

    return {
      totalDecks,
      totalCards,
      totalSessions,
      totalCardsReviewed,
      totalCardsMastered,
      deckStats,
      last7Days,
      retentionData,
      efficiencyData,
      hasData: data.sessions.length > 0 || dailyStats.length > 0,
    };
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Statistics</h2>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <p className="text-xs sm:text-sm text-muted-foreground">Total Decks</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground break-words">{stats.totalDecks}</p>
        </div>
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <p className="text-xs sm:text-sm text-muted-foreground">Total Cards</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground break-words">{stats.totalCards}</p>
        </div>
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <p className="text-xs sm:text-sm text-muted-foreground">Cards Reviewed</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground break-words">
            {stats.totalCardsReviewed}
          </p>
        </div>
        <div className="border rounded-lg p-3 sm:p-4 bg-card">
          <p className="text-xs sm:text-sm text-muted-foreground">Sessions</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground break-words">
            {stats.totalSessions}
          </p>
        </div>
      </div>

      {/* Progress Bar Graph: Last 7 Days */}
      <div className="border rounded-lg p-4 sm:p-6 bg-card">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Progress (Last 7 Days)</h3>
        {stats.last7Days.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.last7Days.map(day => ({
              date: day.date.slice(5), // MM-DD
              reviewed: day.cardsReviewed,
              mastered: day.cardsMastered,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px', color: 'hsl(var(--popover-foreground))' }} />
              <Bar dataKey="reviewed" fill="hsl(var(--primary))" name="Reviewed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mastered" fill="hsl(var(--accent))" name="Mastered" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No study sessions yet. Start reviewing to see your progress!
          </p>
        )}
      </div>


      {/* Study Efficiency Metrics */}
      {stats.hasData && (
        <div className="border rounded-lg p-4 sm:p-6 bg-card">
          <StudyEfficiencyMetrics efficiency={stats.efficiencyData} />
        </div>
      )}

      {/* Retention Curve */}
      {stats.retentionData.length > 0 && (
        <div className="border rounded-lg p-4 sm:p-6 bg-card">
          <RetentionCurve data={stats.retentionData} />
        </div>
      )}

      {/* Deck Difficulty removed for compactness */}
    </div>
  );
}

export default Statistics;
