import { useMemo } from "react";
import { loadAppData, loadDailyStats } from "@/services/storage";
import { DeckStats } from "@/types";

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

    return {
      totalDecks,
      totalCards,
      totalSessions,
      totalCardsReviewed,
      totalCardsMastered,
      deckStats,
      last7Days,
    };
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Statistics</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track your learning progress and performance
        </p>
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

      {/* Last 7 Days Activity */}
      <div className="border rounded-lg p-4 sm:p-6 bg-card">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Last 7 Days Activity</h3>
        {stats.last7Days.length > 0 ? (
          <div className="space-y-2">
            {stats.last7Days.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 rounded bg-muted/50"
              >
                <div className="flex-1">
                  <p className="font-medium">{day.date}</p>
                  <p className="text-sm text-muted-foreground">
                    {day.cardsReviewed} cards • {day.timeSpent} min
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-accent">
                    {day.cardsMastered} mastered
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No study sessions yet. Start reviewing to see your progress!
          </p>
        )}
      </div>

      {/* Deck Performance */}
      <div className="border rounded-lg p-4 sm:p-6 bg-card">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Deck Performance</h3>
        {stats.deckStats.length > 0 ? (
          <div className="space-y-3">
            {/* Use pre-calculated deckName from stats to avoid duplicate localStorage reads */}
            {stats.deckStats.map((deckStat) => (
              <div
                key={deckStat.deckId}
                className="p-3 sm:p-4 rounded bg-muted/50 space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{deckStat.deckName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {deckStat.totalCards} cards • {deckStat.totalReviews}{" "}
                      reviews
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                      Avg: {deckStat.averageRating.toFixed(1)}/4
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${(deckStat.averageRating / 4) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Create decks and start studying to see performance metrics.
          </p>
        )}
      </div>
    </div>
  );
}

export default Statistics;
