import { format, parseISO, differenceInDays, startOfDay, subDays, eachDayOfInterval } from 'date-fns';
import { DailyStats, StudySession, HeatmapValue, StreakData, RetentionPoint, StudyEfficiency } from '@/types';

/**
 * Calculate study streak data from daily statistics
 */
export function calculateStreak(dailyStats: DailyStats[]): StreakData {
  if (dailyStats.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
    };
  }

  // Sort by date descending
  const sorted = [...dailyStats].sort((a, b) => b.date.localeCompare(a.date));

  const today = format(new Date(), 'yyyy-MM-dd');
  const lastStudyDate = sorted[0].date;

  // Calculate current streak
  let currentStreak = 0;
  const todayOrYesterday = [today, format(subDays(new Date(), 1), 'yyyy-MM-dd')];

  if (todayOrYesterday.includes(lastStudyDate)) {
    let checkDate = parseISO(lastStudyDate);
    for (const stat of sorted) {
      const statDate = parseISO(stat.date);
      const daysDiff = differenceInDays(checkDate, statDate);

      if (daysDiff <= 1 && stat.cardsReviewed > 0) {
        currentStreak++;
        checkDate = statDate;
      } else if (daysDiff > 1) {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const stat of sorted.reverse()) {
    if (stat.cardsReviewed === 0) continue;

    const currentDate = parseISO(stat.date);

    if (!prevDate) {
      tempStreak = 1;
    } else {
      const daysDiff = differenceInDays(currentDate, prevDate);
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    prevDate = currentDate;
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    lastStudyDate,
  };
}

/**
 * Generate heatmap data for activity calendar (GitHub-style)
 */
export function generateHeatmapData(dailyStats: DailyStats[], daysBack: number = 365): HeatmapValue[] {
  const today = new Date();
  const startDate = subDays(today, daysBack);

  // Create a map of existing stats
  const statsMap = new Map(
    dailyStats.map(stat => [stat.date, stat.cardsReviewed])
  );

  // Generate data for all days in range
  const dateRange = eachDayOfInterval({ start: startDate, end: today });

  return dateRange.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      date: dateStr,
      count: statsMap.get(dateStr) || 0,
    };
  });
}

/**
 * Calculate retention curve data from study sessions
 * This estimates how well cards are remembered over time
 */
export function calculateRetentionCurve(sessions: StudySession[]): RetentionPoint[] {
  // Group sessions by days since review
  const retentionData: Map<number, { total: number; goodCount: number }> = new Map();

  sessions.forEach(session => {
    if (!session.endTime) return;

    const daysSinceReview = Math.floor(
      differenceInDays(new Date(), new Date(session.startTime))
    );

    // Count ratings 3 and 4 as "retained"
    const goodRatings = (session.ratings[3] || 0) + (session.ratings[4] || 0);
    const totalRatings = Object.values(session.ratings).reduce((sum, val) => sum + val, 0);

    if (totalRatings === 0) return;

    const existing = retentionData.get(daysSinceReview) || { total: 0, goodCount: 0 };
    retentionData.set(daysSinceReview, {
      total: existing.total + totalRatings,
      goodCount: existing.goodCount + goodRatings,
    });
  });

  // Convert to retention points
  const points: RetentionPoint[] = [];
  retentionData.forEach((value, daysSinceReview) => {
    if (daysSinceReview <= 90) { // Only show up to 90 days
      points.push({
        daysSinceReview,
        retentionRate: value.total > 0 ? value.goodCount / value.total : 0,
        sampleSize: value.total,
      });
    }
  });

  return points.sort((a, b) => a.daysSinceReview - b.daysSinceReview);
}

/**
 * Calculate study efficiency metrics
 */
export function calculateStudyEfficiency(
  sessions: StudySession[],
  dailyStats: DailyStats[]
): StudyEfficiency {
  if (sessions.length === 0) {
    return {
      cardsPerMinute: 0,
      averageTimePerCard: 0,
      peakHour: null,
      totalStudyTime: 0,
    };
  }

  // Calculate total study time and cards reviewed
  const totalStudyTime = dailyStats.reduce((sum, stat) => sum + stat.timeSpent, 0);
  const totalCardsReviewed = sessions.reduce((sum, s) => sum + s.cardsReviewed, 0);

  const cardsPerMinute = totalStudyTime > 0 ? totalCardsReviewed / totalStudyTime : 0;
  const averageTimePerCard = totalCardsReviewed > 0 ? (totalStudyTime * 60) / totalCardsReviewed : 0;

  // Calculate peak hour (hour with most reviews)
  const hourCounts: Map<number, number> = new Map();

  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + session.cardsReviewed);
  });

  let peakHour: number | null = null;
  let maxCount = 0;

  hourCounts.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count;
      peakHour = hour;
    }
  });

  return {
    cardsPerMinute,
    averageTimePerCard,
    peakHour,
    totalStudyTime,
  };
}

/**
 * Calculate deck difficulty scores
 * Lower average rating = more difficult deck
 */
export function calculateDeckDifficulty(sessions: StudySession[], deckName: string): number {
  const deckSessions = sessions.filter(s => s.deckId === deckName);

  if (deckSessions.length === 0) return 0;

  let totalWeighted = 0;
  let totalCount = 0;

  deckSessions.forEach(session => {
    const sessionTotal =
      session.ratings[1] * 1 +
      session.ratings[2] * 2 +
      session.ratings[3] * 3 +
      session.ratings[4] * 4;

    const sessionCount =
      session.ratings[1] +
      session.ratings[2] +
      session.ratings[3] +
      session.ratings[4];

    totalWeighted += sessionTotal;
    totalCount += sessionCount;
  });

  return totalCount > 0 ? totalWeighted / totalCount : 0;
}

/**
 * Identify problem cards (cards consistently rated poorly)
 */
export function identifyProblemCards(sessions: StudySession[]): string[] {
  const cardRatings: Map<string, { total: number; lowCount: number }> = new Map();

  sessions.forEach(session => {
    if (!session.cardReviews) return;

    session.cardReviews.forEach(review => {
      const existing = cardRatings.get(review.cardId) || { total: 0, lowCount: 0 };
      cardRatings.set(review.cardId, {
        total: existing.total + 1,
        lowCount: existing.lowCount + (review.rating <= 2 ? 1 : 0),
      });
    });
  });

  const problemCards: string[] = [];

  cardRatings.forEach((data, cardId) => {
    // Card is "problematic" if >50% of ratings are 1 or 2, with at least 3 reviews
    if (data.total >= 3 && data.lowCount / data.total > 0.5) {
      problemCards.push(cardId);
    }
  });

  return problemCards;
}

/**
 * Format time duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format hour for display (e.g., "14" -> "2:00 PM")
 */
export function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}
