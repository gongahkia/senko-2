import { useState, useEffect, useCallback } from "react";
import { MathJax } from "better-react-mathjax";
import { Button } from "@/components/ui/button";
import { useStudySession } from "@/hooks/useStudySession";
import { QuestionItem, StudyMode } from "@/types";

interface RecallProps {
  deckId: string;
  questions: QuestionItem[];
  studyMode: StudyMode;
}

export function Recall({ deckId, questions }: RecallProps) {
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

  // Keyboard listener
  useEffect(() => {
    if (isCompleted) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (mode === "question") {
          setMode("answer-rating");
        }
      }

      if (
        mode === "answer-rating" &&
        ["1", "2", "3", "4"].includes(event.key)
      ) {
        event.preventDefault();
        onRating(Number(event.key) as 1 | 2 | 3 | 4);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, isCompleted, onRating]);

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
          {/* Question */}
          <div className="text-xl font-medium mt-2 mb-6 text-center whitespace-pre-wrap">
            <MathJax dynamic>{currentCard.question}</MathJax>
          </div>

          {/* Image if present */}
          {currentCard.imageUrl && mode === "question" && (
            <div className="mb-6 flex justify-center">
              <img
                src={currentCard.imageUrl}
                alt="Question diagram"
                className="max-w-md rounded border"
              />
            </div>
          )}

          {/* Answer */}
          {mode === "answer-rating" && (
            <div className="mb-6 p-4 w-full bg-muted rounded-md shadow-sm whitespace-pre-wrap">
              <p className="font-medium">Answer:</p>
              <p className="mt-2">
                <MathJax dynamic>{currentCard.answer}</MathJax>
              </p>
              {currentCard.imageUrl && (
                <div className="mt-4">
                  <img
                    src={currentCard.imageUrl}
                    alt="Answer diagram"
                    className="max-w-md rounded border"
                  />
                </div>
              )}
            </div>
          )}

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
