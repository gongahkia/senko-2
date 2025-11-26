import { Flame, Trophy } from 'lucide-react';
import { StreakData } from '@/types';
import { format, parseISO } from 'date-fns';

interface StreakDisplayProps {
  streakData: StreakData;
}

export function StreakDisplay({ streakData }: StreakDisplayProps) {
  const { currentStreak, longestStreak, lastStudyDate } = streakData;

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {/* Current Streak */}
      <div className="border rounded-lg p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h4 className="font-semibold text-sm sm:text-base">Current Streak</h4>
        </div>
        <div className="space-y-1">
          <p className="text-3xl sm:text-4xl font-bold text-foreground">
            {currentStreak} <span className="text-base sm:text-lg font-normal text-muted-foreground">
              day{currentStreak === 1 ? '' : 's'}
            </span>
          </p>
          {lastStudyDate && (
            <p className="text-xs text-muted-foreground">
              Last study: {formatDate(lastStudyDate)}
            </p>
          )}
        </div>
        {currentStreak === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Start studying today to begin your streak!
          </p>
        )}
        {currentStreak > 0 && currentStreak < 7 && (
          <p className="text-xs text-muted-foreground mt-2">
            Keep going! Study tomorrow to maintain your streak.
          </p>
        )}
        {currentStreak >= 7 && (
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
            Amazing consistency! 🔥
          </p>
        )}
      </div>

      {/* Longest Streak */}
      <div className="border rounded-lg p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 dark:from-yellow-500/20 dark:to-amber-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          <h4 className="font-semibold text-sm sm:text-base">Longest Streak</h4>
        </div>
        <div className="space-y-1">
          <p className="text-3xl sm:text-4xl font-bold text-foreground">
            {longestStreak} <span className="text-base sm:text-lg font-normal text-muted-foreground">
              day{longestStreak === 1 ? '' : 's'}
            </span>
          </p>
          {longestStreak > 0 && (
            <p className="text-xs text-muted-foreground">
              Personal best record
            </p>
          )}
        </div>
        {longestStreak === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Complete your first study session!
          </p>
        )}
        {longestStreak > 0 && currentStreak === longestStreak && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-medium">
            You're at your peak! 🏆
          </p>
        )}
        {longestStreak > 0 && currentStreak < longestStreak && (
          <p className="text-xs text-muted-foreground mt-2">
            Beat your record: {longestStreak - currentStreak} more day{longestStreak - currentStreak === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  );
}
