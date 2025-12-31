import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { QuestionRenderer } from "@/components/QuestionRenderer";
import { useStudySession } from "@/hooks/useStudySession";
import { useKeyboardBindings } from "@/hooks/useKeyboardBindings";
import { QuestionItem, StudyMode } from "@/types";

type KeyboardMode = "default" | "vim" | "emacs";

interface RecallProps {
  deckId: string;
  questions: QuestionItem[];
  studyMode: StudyMode;
  keyboardMode: KeyboardMode;
}

export function Recall({ deckId, questions, keyboardMode }: RecallProps) {
  const [mode, setMode] = useState<"question" | "answer-rating">("question");

  const {
    currentCard,
    cardsReviewed,
    cardsMastered,
    totalCards,
    isCompleted,
    handleRating,
    undoLastRating,
    canUndo,
    resetSession,
  } = useStudySession(deckId, questions);

  const onRating = useCallback(
    (rating: 1 | 2 | 3 | 4) => {
      handleRating(rating);
      setMode("question");
    },
    [handleRating]
  );

  const handleFlipCard = useCallback(() => {
    if (mode === "question") {
      setMode("answer-rating");
    }
  }, [mode]);

  // Keyboard bindings
  useKeyboardBindings({
    mode: keyboardMode,
    onFlipCard: handleFlipCard,
    onRate: onRating,
    onUndo: canUndo ? undoLastRating : undefined,
    enabled: !isCompleted,
    currentMode: mode,
  });

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-xl sm:text-2xl text-foreground">Active Recall</p>
        <div className="py-8 text-center text-muted-foreground">
          No questions in this deck. Add some in the Questions tab.
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="space-y-4">
        <p className="text-xl sm:text-2xl text-foreground">Active Recall</p>
        <div className="py-8 text-center bg-accent/20 rounded-lg border border-accent">
          <h3 className="text-xl sm:text-2xl font-medium text-accent-foreground mb-2">
            Session Completed!
          </h3>
          <p className="text-sm sm:text-base text-accent-foreground/80">
            You've mastered all {totalCards} cards.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Total cards reviewed: {cardsReviewed}
          </p>
          <Button onClick={resetSession} className="mt-6">
            Restart Session
          </Button>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="space-y-4">
        <p className="text-xl sm:text-2xl text-foreground">Active Recall</p>
        <div className="py-8 text-center text-muted-foreground">
          Loading flashcards...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <p className="text-xl sm:text-2xl text-foreground">Active Recall</p>

      <div className="flex flex-col min-h-[60vh] sm:min-h-[50vh] p-4 sm:p-6 border rounded-lg bg-card relative">
        {/* Progress indicator */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-xs sm:text-sm text-muted-foreground text-right">
          <div className="font-medium">
            {cardsMastered}/{totalCards}
          </div>
          <div className="text-xs opacity-75">Reviewed: {cardsReviewed}</div>
        </div>

        {/* Undo button - bottom right */}
        {canUndo && (
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex flex-col items-end gap-1">
            <Button
              onClick={undoLastRating}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
            >
              ↶ Undo Last Rating
            </Button>
            <p className="text-xs text-muted-foreground hidden sm:block">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+Z</kbd>
            </p>
          </div>
        )}

        {/* Content */}
        <div
          className="flex flex-col h-full pt-12 sm:pt-10 cursor-pointer overflow-y-auto"
          onClick={() => mode === "question" && handleFlipCard()}
          onTouchEnd={() => mode === "question" && handleFlipCard()}
        >
          <QuestionRenderer
            question={{ ...currentCard, type: currentCard.type || "flashcard" }}
            mode={mode}
          />

          {/* Rating UI or Space prompt */}
          {mode === "answer-rating" ? (
            <div className="mt-auto pt-6 w-full pb-12 sm:pb-10 flex-shrink-0">
              <p className="mb-3 sm:mb-4 text-center text-sm sm:text-base text-muted-foreground">
                How well did you know this?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                <Button
                  onClick={() => onRating(1)}
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600 w-full sm:w-auto text-sm sm:text-base py-5 sm:py-2"
                >
                  1 - Bad
                </Button>
                <Button
                  onClick={() => onRating(2)}
                  className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto text-sm sm:text-base py-5 sm:py-2"
                >
                  2 - Good
                </Button>
                <Button
                  onClick={() => onRating(3)}
                  className="bg-green-500 hover:bg-green-600 w-full sm:w-auto text-sm sm:text-base py-5 sm:py-2"
                >
                  3 - Better
                </Button>
                <Button
                  onClick={() => onRating(4)}
                  className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto text-sm sm:text-base py-5 sm:py-2"
                >
                  4 - Easy
                </Button>
              </div>
              <div className="mt-3 sm:mt-4 text-center text-muted-foreground text-xs sm:text-sm hidden sm:block">
                Press <kbd className="px-2 py-1 bg-muted rounded">1</kbd>{" "}
                <kbd className="px-2 py-1 bg-muted rounded">2</kbd>{" "}
                <kbd className="px-2 py-1 bg-muted rounded">3</kbd>{" "}
                <kbd className="px-2 py-1 bg-muted rounded">4</kbd> to rate
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center mt-4">
              <div className="text-center text-muted-foreground text-sm sm:text-base">
                <div className="mb-2 sm:hidden">Tap anywhere to reveal</div>
                <div className="hidden sm:block">
                  Press <kbd className="px-2 py-1 bg-muted rounded">space</kbd> to show answer
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recall;
