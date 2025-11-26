import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DeckStats } from '@/types';

interface DeckDifficultyProps {
  deckStats: DeckStats[];
}

export function DeckDifficulty({ deckStats }: DeckDifficultyProps) {
  if (deckStats.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Create decks and start studying to see difficulty analysis!</p>
      </div>
    );
  }

  // Sort by average rating (ascending = most difficult first)
  const sortedDecks = [...deckStats]
    .filter(deck => deck.totalReviews > 0)
    .sort((a, b) => a.averageRating - b.averageRating);

  if (sortedDecks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Review some cards to see deck difficulty analysis!</p>
      </div>
    );
  }

  // Format data for recharts
  const chartData = sortedDecks.map(deck => ({
    name: deck.deckName.length > 15 ? deck.deckName.substring(0, 15) + '...' : deck.deckName,
    fullName: deck.deckName,
    avgRating: Number(deck.averageRating.toFixed(2)),
    reviews: deck.totalReviews,
  }));

  // Color based on difficulty (low rating = difficult = red, high rating = easy = green)
  const getColor = (rating: number): string => {
    if (rating < 2) return 'hsl(0, 70%, 50%)'; // Red - Very Difficult
    if (rating < 2.5) return 'hsl(25, 70%, 50%)'; // Orange - Difficult
    if (rating < 3) return 'hsl(45, 70%, 50%)'; // Yellow - Moderate
    if (rating < 3.5) return 'hsl(80, 60%, 45%)'; // Yellow-Green - Easy
    return 'hsl(120, 50%, 40%)'; // Green - Very Easy
  };

  return (
    <div className="w-full">
      <div className="mb-3">
        <h3 className="text-base sm:text-lg font-semibold mb-1">Deck Difficulty Analysis</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Average rating per deck (1=Difficult, 4=Easy)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(300, sortedDecks.length * 50)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            domain={[0, 4]}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            label={{ value: 'Average Rating', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            dataKey="name"
            type="category"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              color: 'hsl(var(--popover-foreground))',
            }}
            labelFormatter={(value, payload) => {
              const item = payload[0]?.payload;
              return item?.fullName || value;
            }}
            formatter={(value: number, name: string) => {
              if (name === 'avgRating') return [value.toFixed(2), 'Avg Rating'];
              if (name === 'reviews') return [value, 'Reviews'];
              return [value, name];
            }}
          />
          <Bar dataKey="avgRating" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.avgRating)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'hsl(0, 70%, 50%)' }} />
          <span className="text-muted-foreground">Very Difficult (&lt;2.0)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'hsl(25, 70%, 50%)' }} />
          <span className="text-muted-foreground">Difficult (2.0-2.5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'hsl(45, 70%, 50%)' }} />
          <span className="text-muted-foreground">Moderate (2.5-3.0)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'hsl(80, 60%, 45%)' }} />
          <span className="text-muted-foreground">Easy (3.0-3.5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'hsl(120, 50%, 40%)' }} />
          <span className="text-muted-foreground">Very Easy (&gt;3.5)</span>
        </div>
      </div>

    </div>
  );
}
