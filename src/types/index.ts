// Core data structures

export type QuestionType = "flashcard" | "multiple-choice" | "true-false" | "fill-in-blank" | "matching" | "ordering" | "multi-select";

export type QuestionItem = {
  type: QuestionType;
  question: string;
  answer: string;
  imageUrl?: string; // Optional base64 or URL for images
  // For multiple-choice questions
  options?: string[];
  // For fill-in-blank questions
  blanks?: string[]; // Array of correct answers for each blank
  // For matching questions
  matchPairs?: { left: string; right: string }[]; // Array of pairs to match
  // For ordering questions
  orderItems?: string[]; // Array of items in correct order
  // For multi-select questions
  correctAnswers?: string[]; // Array of correct option indices/values
};

export type FlashCard = QuestionItem & {
  id: string;
  status: "unseen" | "learning" | "mastered";
  lastRating: number | null;
  reviewCount: number;
  createdAt: number;
  lastReviewedAt: number | null;
};

export type Deck = {
  id: string;
  name: string;
  description?: string;
  questions: QuestionItem[];
  createdAt: number;
  updatedAt: number;
  color?: string; // Optional color tag
};

export type CardReview = {
  cardId: string;
  rating: 1 | 2 | 3 | 4;
  timestamp: number;
  timeSpent: number; // seconds spent on this card
};

export type StudySession = {
  id: string;
  deckId: string;
  startTime: number;
  endTime?: number;
  cardsReviewed: number;
  cardsMastered: number;
  ratings: {
    1: number; // Bad
    2: number; // Good
    3: number; // Better
    4: number; // Easy
  };
  // Enhanced tracking for analytics
  cardReviews?: CardReview[]; // Individual card reviews with timestamps
};

export type ColorScheme =
  | "default-light"
  | "default-dark"
  | "gruvbox-light"
  | "gruvbox-dark"
  | "catppuccin-latte"
  | "catppuccin-frappe"
  | "catppuccin-macchiato"
  | "catppuccin-mocha"
  | "ayu-light"
  | "ayu-dark"
  | "ayu-mirage"
  | "nord"
  | "tokyo-night"
  | "dracula"
  | "solarized-light"
  | "solarized-dark"
  | "one-dark"
  | "one-light"
  | "monokai"
  | "everforest-light"
  | "everforest-dark"
  | "rose-pine"
  | "rose-pine-moon"
  | "kanagawa"
  | "github-light"
  | "github-dark"
  | "night-owl"
  | "palenight"
  | "synthwave-84"
  | "horizon"
  | "andromeda"
  | "cobalt2"
  | "shades-of-purple"
  | "oceanic-next"
  | "material-dark"
  | "panda"
  | "snazzy"
  | "darcula"
  | "moonlight"
  | "vitesse-dark"
  | "winter-is-coming"
  | "vesper"
  | "flexoki-light"
  | "flexoki-dark"
  | "arc-dark"
  | "iceberg"
  | "tomorrow-night"
  | "monokai-pro"
  | "bluloco-dark"
  | "laserwave"
  | "slack-dark"
  | "fairy-floss"
  | "aura-dark"
  | "catppuccin-rose"
  | "atom-one-dark-pro"
  | "sublime-material"
  | "twilight"
  | "zenburn"
  | "afterglow"
  | "spacegray"
  | "merbivore"
  | "apprentice"
  | "papercolor-light"
  | "base16-ocean"
  | "gruvbox-material"
  | "poimandres"
  | "bearded-arc"
  | "noctis"
  | "rainglow"
  | "embark"
  | "plastic"
  | "min-dark"
  | "pear"
  | "serendipity"
  | "seti"
  | "material-palenight"
  | "high-contrast"
  | "quiet-light"
  | "blueberry"
  | "sunburst"
  | "autumn"
  | "earthsong"
  | "alabaster"
  | "cobalt"
  | "brackets-light"
  | "brackets-dark"
  | "espresso"
  | "hopscotch"
  | "ir-black"
  | "kimbie-dark"
  | "marrakesh"
  | "paraiso-dark"
  | "railscasts"
  | "summerfruit-dark"
  | "tomorrow-night-blue"
  | "tomorrow-night-bright"
  | "chalk"
  | "flat"
  | "isotope"
  | "xcode";

export type AppSettings = {
  colorScheme: ColorScheme;
  autoPlayMode: boolean;
  soundEnabled: boolean;
};

export type AppData = {
  decks: Deck[];
  sessions: StudySession[];
  settings: AppSettings;
  currentDeckId: string | null;
  version: string;
};

// Statistics types
export type DailyStats = {
  date: string; // YYYY-MM-DD
  cardsReviewed: number;
  cardsMastered: number;
  timeSpent: number; // in minutes
  // Enhanced analytics
  sessionsCount?: number; // number of study sessions
  averageRating?: number; // average rating across all cards
  accuracy?: number; // percentage of cards rated 3 or 4
  cardsPerMinute?: number; // study efficiency
};

export type DeckStats = {
  deckId: string;
  deckName: string;
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  unseenCards: number;
  averageRating: number;
  totalReviews: number;
};

// Enhanced statistics types
export type HeatmapValue = {
  date: string; // YYYY-MM-DD
  count: number; // number of cards reviewed
};

export type StreakData = {
  currentStreak: number; // days
  longestStreak: number; // days
  lastStudyDate: string | null; // YYYY-MM-DD
};

export type RetentionPoint = {
  daysSinceReview: number;
  retentionRate: number; // 0-1 (percentage of cards still remembered)
  sampleSize: number; // number of cards in this data point
};

export type StudyEfficiency = {
  cardsPerMinute: number;
  averageTimePerCard: number; // in seconds
  peakHour: number | null; // hour of day (0-23) with most reviews
  totalStudyTime: number; // in minutes
};
