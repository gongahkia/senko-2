// localStorage service layer - all data persistence goes through here

import { AppData, Deck, StudySession, AppSettings, DailyStats } from "@/types";

const STORAGE_KEYS = {
  APP_DATA: "senko-2-app-data",
  DAILY_STATS: "senko-2-daily-stats",
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  colorScheme: "default-light",
  autoPlayMode: false,
  soundEnabled: false,
  defaultStudyMode: "normal",
  pomodoroSettings: {
    workDuration: 25,
    breakDuration: 5,
  },
  sprintSettings: {
    timePerCard: 30,
  },
};

const DEFAULT_APP_DATA: AppData = {
  decks: [],
  sessions: [],
  settings: DEFAULT_SETTINGS,
  currentDeckId: null,
  version: "1.0.0",
};

// Get all app data
export const loadAppData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.APP_DATA);
    if (!stored) return DEFAULT_APP_DATA;

    const parsed = JSON.parse(stored) as AppData;
    // Merge with defaults to handle version upgrades
    return {
      ...DEFAULT_APP_DATA,
      ...parsed,
      settings: {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
      },
    };
  } catch (error) {
    console.error("Failed to load app data:", error);
    return DEFAULT_APP_DATA;
  }
};

// Save all app data
export const saveAppData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_DATA, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save app data:", error);
  }
};

// Deck operations
export const saveDecks = (decks: Deck[]): void => {
  const data = loadAppData();
  data.decks = decks;
  saveAppData(data);
};

export const getDeck = (deckId: string): Deck | null => {
  const data = loadAppData();
  return data.decks.find((d) => d.id === deckId) || null;
};

export const addDeck = (deck: Deck): void => {
  const data = loadAppData();
  data.decks.push(deck);
  saveAppData(data);
};

export const updateDeck = (deckId: string, updates: Partial<Deck>): void => {
  const data = loadAppData();
  const index = data.decks.findIndex((d) => d.id === deckId);
  if (index !== -1) {
    data.decks[index] = { ...data.decks[index], ...updates, updatedAt: Date.now() };
    saveAppData(data);
  }
};

export const deleteDeck = (deckId: string): void => {
  const data = loadAppData();
  data.decks = data.decks.filter((d) => d.id !== deckId);
  // Also delete associated sessions
  data.sessions = data.sessions.filter((s) => s.deckId !== deckId);
  if (data.currentDeckId === deckId) {
    data.currentDeckId = null;
  }
  saveAppData(data);
};

// Session operations
export const saveSessions = (sessions: StudySession[]): void => {
  const data = loadAppData();
  data.sessions = sessions;
  saveAppData(data);
};

export const addSession = (session: StudySession): void => {
  const data = loadAppData();
  data.sessions.push(session);
  saveAppData(data);
};

export const updateSession = (sessionId: string, updates: Partial<StudySession>): void => {
  const data = loadAppData();
  const index = data.sessions.findIndex((s) => s.id === sessionId);
  if (index !== -1) {
    data.sessions[index] = { ...data.sessions[index], ...updates };
    saveAppData(data);
  }
};

// Settings operations
export const getSettings = (): AppSettings => {
  const data = loadAppData();
  return data.settings;
};

export const updateSettings = (updates: Partial<AppSettings>): void => {
  const data = loadAppData();
  data.settings = { ...data.settings, ...updates };
  saveAppData(data);
};

// Current deck
export const getCurrentDeckId = (): string | null => {
  const data = loadAppData();
  return data.currentDeckId;
};

export const setCurrentDeckId = (deckId: string | null): void => {
  const data = loadAppData();
  data.currentDeckId = deckId;
  saveAppData(data);
};

// Daily stats operations
export const loadDailyStats = (): DailyStats[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load daily stats:", error);
    return [];
  }
};

export const saveDailyStats = (stats: DailyStats[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error("Failed to save daily stats:", error);
  }
};

export const addDailyStats = (stat: DailyStats): void => {
  const stats = loadDailyStats();
  const existingIndex = stats.findIndex((s) => s.date === stat.date);

  if (existingIndex !== -1) {
    // Merge with existing stats for the day
    stats[existingIndex] = {
      date: stat.date,
      cardsReviewed: stats[existingIndex].cardsReviewed + stat.cardsReviewed,
      cardsMastered: stats[existingIndex].cardsMastered + stat.cardsMastered,
      timeSpent: stats[existingIndex].timeSpent + stat.timeSpent,
    };
  } else {
    stats.push(stat);
  }

  saveDailyStats(stats);
};

// Import/Export utilities
export const exportDeck = (deckId: string): string | null => {
  const deck = getDeck(deckId);
  if (!deck) return null;
  return JSON.stringify(deck, null, 2);
};

export const importDeck = (deckJson: string): Deck | null => {
  try {
    const deck = JSON.parse(deckJson) as Deck;
    // Generate new ID to avoid conflicts
    deck.id = `deck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    deck.createdAt = Date.now();
    deck.updatedAt = Date.now();
    addDeck(deck);
    return deck;
  } catch (error) {
    console.error("Failed to import deck:", error);
    return null;
  }
};

export const exportAllData = (): string => {
  const data = loadAppData();
  return JSON.stringify(data, null, 2);
};

export const importAllData = (dataJson: string): boolean => {
  try {
    const data = JSON.parse(dataJson) as AppData;
    saveAppData(data);
    return true;
  } catch (error) {
    console.error("Failed to import data:", error);
    return false;
  }
};

// Clear all data (with confirmation in UI)
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.APP_DATA);
  localStorage.removeItem(STORAGE_KEYS.DAILY_STATS);
};
