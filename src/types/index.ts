// Core data structures

export type QuestionType = "flashcard" | "multiple-choice" | "true-false" | "fill-in-blank";

export type QuestionItem = {
  type: QuestionType;
  question: string;
  answer: string;
  imageUrl?: string; // Optional base64 or URL for images
  // For multiple-choice questions
  options?: string[];
  // For fill-in-blank questions
  blanks?: string[]; // Array of correct answers for each blank
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
};

export type StudyMode = "normal" | "pomodoro" | "sprint" | "zen";

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
  | "dracula";

export type AppSettings = {
  colorScheme: ColorScheme;
  autoPlayMode: boolean;
  soundEnabled: boolean;
  defaultStudyMode: StudyMode;
  pomodoroSettings: {
    workDuration: number; // in minutes
    breakDuration: number;
  };
  sprintSettings: {
    timePerCard: number; // in seconds
  };
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
};

export type DeckStats = {
  deckId: string;
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  unseenCards: number;
  averageRating: number;
  totalReviews: number;
};
