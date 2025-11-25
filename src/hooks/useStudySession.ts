import { useState, useCallback, useEffect } from "react";
import { FlashCard, StudySession, QuestionItem } from "@/types";
import { shuffle, generateId, formatDateKey } from "@/lib/utils";
import { addSession, addDailyStats } from "@/services/storage";

interface UndoState {
  flashcardQueue: FlashCard[];
  cardsReviewed: number;
  cardsMastered: number;
  ratings: { 1: number; 2: number; 3: number; 4: number };
  isCompleted: boolean;
}

export function useStudySession(
  deckId: string,
  questions: QuestionItem[]
) {
  const [flashcardQueue, setFlashcardQueue] = useState<FlashCard[]>([]);
  const [sessionId] = useState(() => generateId("session"));
  const [sessionStartTime] = useState(Date.now());
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [cardsMastered, setCardsMastered] = useState(0);
  const [ratings, setRatings] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [isCompleted, setIsCompleted] = useState(false);
  const [undoState, setUndoState] = useState<UndoState | null>(null);

  // Initialize flashcards
  useEffect(() => {
    if (questions.length > 0) {
      const initialFlashcards: FlashCard[] = questions.map((q) => ({
        id: generateId("card"),
        type: q.type || "flashcard",
        question: q.question,
        answer: q.answer,
        imageUrl: q.imageUrl,
        options: q.options,
        blanks: q.blanks,
        status: "unseen",
        lastRating: null,
        reviewCount: 0,
        createdAt: Date.now(),
        lastReviewedAt: null,
      }));

      setFlashcardQueue(shuffle(initialFlashcards));
      setIsCompleted(false);
      setCardsReviewed(0);
      setCardsMastered(0);
      setRatings({ 1: 0, 2: 0, 3: 0, 4: 0 });
      setUndoState(null);
    }
  }, [questions]);

  const handleRating = useCallback(
    (rating: 1 | 2 | 3 | 4) => {
      if (flashcardQueue.length === 0) return;

      const updatedQueue = [...flashcardQueue];
      const currentCard = updatedQueue.shift();

      if (!currentCard) return;

      // Update card
      const updatedCard: FlashCard = {
        ...currentCard,
        status: rating === 4 ? "mastered" : "learning",
        lastRating: rating,
        reviewCount: currentCard.reviewCount + 1,
        lastReviewedAt: Date.now(),
      };

      // Update stats
      setCardsReviewed((prev) => prev + 1);
      setRatings((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

      const isNewlyMastered =
        updatedCard.status === "mastered" && currentCard.status !== "mastered";
      if (isNewlyMastered) {
        setCardsMastered((prev) => prev + 1);
      }

      // Check completion
      const allMastered = updatedQueue.every((card) => card.status === "mastered");
      if (allMastered && rating === 4) {
        setIsCompleted(true);
        endSession();
        return;
      }

      // Queue logic
      if (rating === 4) {
        updatedQueue.push(updatedCard);
      } else {
        const hasUnseenCards = updatedQueue.some((card) => card.status === "unseen");

        if (hasUnseenCards) {
          const lastUnseenIndex = updatedQueue.findIndex(
            (card, idx, arr) =>
              card.status === "unseen" &&
              (idx === arr.length - 1 || arr[idx + 1].status !== "unseen")
          );
          updatedQueue.splice(lastUnseenIndex + 1, 0, updatedCard);
        } else {
          const positions = {
            1: 0,
            2: Math.max(Math.floor(updatedQueue.length / 3), 1),
            3: Math.max(Math.floor((updatedQueue.length * 2) / 3), 2),
          };
          updatedQueue.splice(positions[rating], 0, updatedCard);
        }
      }

      setFlashcardQueue(updatedQueue);
    },
    [flashcardQueue]
  );

  const endSession = useCallback(() => {
    const session: StudySession = {
      id: sessionId,
      deckId,
      startTime: sessionStartTime,
      endTime: Date.now(),
      cardsReviewed,
      cardsMastered,
      ratings,
    };

    addSession(session);

    // Add daily stats
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
    addDailyStats({
      date: formatDateKey(),
      cardsReviewed,
      cardsMastered,
      timeSpent,
    });
  }, [sessionId, deckId, sessionStartTime, cardsReviewed, cardsMastered, ratings]);

  const resetSession = useCallback(() => {
    if (questions.length > 0) {
      const resetFlashcards: FlashCard[] = questions.map((q) => ({
        id: generateId("card"),
        type: q.type || "flashcard",
        question: q.question,
        answer: q.answer,
        imageUrl: q.imageUrl,
        options: q.options,
        blanks: q.blanks,
        status: "unseen",
        lastRating: null,
        reviewCount: 0,
        createdAt: Date.now(),
        lastReviewedAt: null,
      }));

      setFlashcardQueue(shuffle(resetFlashcards));
      setIsCompleted(false);
      setCardsReviewed(0);
      setCardsMastered(0);
      setRatings({ 1: 0, 2: 0, 3: 0, 4: 0 });
    }
  }, [questions]);

  return {
    flashcardQueue,
    currentCard: flashcardQueue[0] || null,
    cardsReviewed,
    cardsMastered,
    ratings,
    isCompleted,
    handleRating,
    resetSession,
    totalCards: questions.length,
  };
}
