import { useState, useEffect, useCallback } from "react";
import { Deck, QuestionItem } from "@/types";
import {
  loadAppData,
  addDeck,
  updateDeck,
  deleteDeck,
  setCurrentDeckId as saveCurrentDeckId,
} from "@/services/storage";
import { generateId, normalizeQuestion } from "@/lib/utils";

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [currentDeckId, setCurrentDeckIdState] = useState<string | null>(null);

  // Load decks on mount
  useEffect(() => {
    const data = loadAppData();
    // Normalize all questions in all decks to ensure derived fields are populated
    const normalizedDecks = data.decks.map(deck => ({
      ...deck,
      questions: deck.questions.map(normalizeQuestion)
    }));
    setDecks(normalizedDecks);
    setCurrentDeckIdState(data.currentDeckId);
  }, []);

  const currentDeck = decks.find((d) => d.id === currentDeckId) || null;

  const createDeck = useCallback(
    (name: string, description?: string, questions: QuestionItem[] = []) => {
      const newDeck: Deck = {
        id: generateId("deck"),
        name,
        description,
        questions,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addDeck(newDeck);
      setDecks((prev) => [...prev, newDeck]);

      // Auto-select if it's the first deck
      if (decks.length === 0) {
        setCurrentDeckIdState(newDeck.id);
        saveCurrentDeckId(newDeck.id);
      }

      return newDeck;
    },
    [decks.length]
  );

  const updateDeckData = useCallback((deckId: string, updates: Partial<Deck>) => {
    updateDeck(deckId, updates);
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId ? { ...d, ...updates, updatedAt: Date.now() } : d
      )
    );
  }, []);

  const removeDeck = useCallback((deckId: string) => {
    deleteDeck(deckId);
    setDecks((prev) => prev.filter((d) => d.id !== deckId));

    if (currentDeckId === deckId) {
      setCurrentDeckIdState(null);
    }
  }, [currentDeckId]);

  const setCurrentDeckId = useCallback((deckId: string | null) => {
    setCurrentDeckIdState(deckId);
    saveCurrentDeckId(deckId);
  }, []);

  return {
    decks,
    currentDeck,
    currentDeckId,
    createDeck,
    updateDeck: updateDeckData,
    deleteDeck: removeDeck,
    setCurrentDeckId,
  };
}
