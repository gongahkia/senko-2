import { useState, useCallback } from "react";
import { MathJax } from "better-react-mathjax";
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
    enabled: !isCompleted,
    currentMode: mode,
  });

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-2xl text-foreground">Active Recall</p>
        <div className="py-8 text-center text-muted-foreground">
          No questions in this deck. Add some in the Questions tab.
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="space-y-4">
        <p className="text-2xl text-foreground">Active Recall</p>
        <div className="py-8 text-center bg-accent/20 rounded-lg border border-accent">
          <h3 className="text-2xl font-medium text-accent-foreground mb-2">
            Session Completed!
          </h3>
          <p className="text-accent-foreground/80">
            You've mastered all {totalCards} cards.
          </p>
          <p className="text-muted-foreground mt-2">
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
        <p className="text-2xl text-foreground">Active Recall</p>
        <div className="py-8 text-center text-muted-foreground">
          Loading flashcards...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-2xl text-foreground">Active Recall</p>

      <div className="flex flex-col min-h-[50vh] p-6 border rounded-lg bg-card relative">
        {/* Progress indicator */}
        <div className="absolute top-4 right-4 text-sm text-muted-foreground text-right">
          <div>
            Mastered: {cardsMastered} of {totalCards}
          </div>
          <div>Reviewed: {cardsReviewed}</div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full pt-10">
          <QuestionRenderer
            question={{ ...currentCard, type: currentCard.type || "flashcard" }}
            mode={mode}
          />

          {/* Rating UI or Space prompt */}
          {mode === "answer-rating" ? (
            <div className="mt-auto w-full">
              <p className="mb-4 text-center text-muted-foreground">
                How well did you know this?
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  onClick={() => onRating(1)}
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600"
                >
                  1 - Bad
                </Button>
                <Button
                  onClick={() => onRating(2)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  2 - Good
                </Button>
                <Button
                  onClick={() => onRating(3)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  3 - Better
                </Button>
                <Button
                  onClick={() => onRating(4)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  4 - Easy
                </Button>
              </div>
              <div className="mt-4 text-center text-muted-foreground text-sm">
                Press <kbd className="px-2 py-1 bg-muted rounded">1</kbd>{" "}
                <kbd className="px-2 py-1 bg-muted rounded">2</kbd>{" "}
                <kbd className="px-2 py-1 bg-muted rounded">3</kbd>{" "}
                <kbd className="px-2 py-1 bg-muted rounded">4</kbd> to rate
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                Press{" "}
                <kbd className="px-2 py-1 bg-muted rounded">space</kbd> to show
                answer
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
