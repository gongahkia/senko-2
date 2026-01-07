import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QuestionItem } from "@/types";
import { MarkdownText } from "@/components/MarkdownText";
import { shuffle } from "@/lib/utils";

interface QuestionRendererProps {
  question: QuestionItem;
  mode: "question" | "answer-rating";
  onAnswer?: (isCorrect: boolean) => void;
}

export function QuestionRenderer({ question, mode, onAnswer }: QuestionRendererProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [userInput, setUserInput] = useState("");
  const [matchSelections, setMatchSelections] = useState<Map<string, string>>(new Map());
  const [orderSelections, setOrderSelections] = useState<string[]>([]);
  
  // Derive orderItems from answer if not present (for backwards compatibility)
  const effectiveOrderItems = useMemo(() => {
    if (question.orderItems && question.orderItems.length > 0) {
      return question.orderItems;
    }
    if (question.type === "ordering" && question.answer) {
      // Handle both → and | separators
      return question.answer.split(/\s*(?:→|\|)\s*/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [question.orderItems, question.type, question.answer]);
  
  // Derive matchPairs from answer if not present (for backwards compatibility)
  const effectiveMatchPairs = useMemo(() => {
    if (question.matchPairs && question.matchPairs.length > 0) {
      return question.matchPairs;
    }
    if (question.type === "matching" && question.answer) {
      // Answer format: "France → Paris, Germany → Berlin" or "France -> Paris | Germany -> Berlin"
      const pairs = question.answer.split(/\s*(?:\||,)\s*/).map(pair => {
        const parts = pair.split(/\s*(?:→|->)\s*/);
        if (parts.length >= 2) {
          return { left: parts[0]?.trim() || "", right: parts[1]?.trim() || "" };
        }
        return { left: "", right: "" };
      }).filter(p => p.left && p.right);
      return pairs;
    }
    return [];
  }, [question.matchPairs, question.type, question.answer]);

  // Use useMemo with a stable shuffle (seeded by question content)
  const shuffledItems = useMemo(() => {
    if (question.type === "matching" && effectiveMatchPairs.length > 0) {
      return shuffle(effectiveMatchPairs.map(p => p.right));
    }
    if (question.type === "ordering" && effectiveOrderItems.length > 0) {
      return shuffle([...effectiveOrderItems]);
    }
    return [];
  }, [question.type, effectiveMatchPairs, effectiveOrderItems]);

  const handleMultipleChoiceSelect = (option: string) => {
    setSelectedOption(option);
    if (onAnswer) {
      onAnswer(option === question.answer);
    }
  };

  const handleTrueFalseSelect = (value: "True" | "False") => {
    if (onAnswer) {
      onAnswer(value === question.answer);
    }
  };

  const handleFillInBlankSubmit = () => {
    if (onAnswer && question.blanks) {
      const userAnswers = userInput.split("|").map(a => a.trim().toLowerCase());
      const correctAnswers = question.blanks.map(a => a.toLowerCase());
      const isCorrect = userAnswers.every((ans, idx) => ans === correctAnswers[idx]);
      onAnswer(isCorrect);
    }
  };

  const handleMultiSelectToggle = (option: string) => {
    const newSelections = new Set(selectedOptions);
    if (newSelections.has(option)) {
      newSelections.delete(option);
    } else {
      newSelections.add(option);
    }
    setSelectedOptions(newSelections);
  };

  const handleMultiSelectSubmit = () => {
    if (onAnswer && question.correctAnswers) {
      const selectedPrefixes = Array.from(selectedOptions).map(opt => opt.charAt(0));
      const correctPrefixes = question.correctAnswers.map(a => a.charAt(0));
      const isCorrect = selectedPrefixes.length === correctPrefixes.length &&
        selectedPrefixes.every(s => correctPrefixes.includes(s));
      onAnswer(isCorrect);
    }
  };

  const handleMatchSelect = (left: string, right: string) => {
    const newSelections = new Map(matchSelections);
    newSelections.set(left, right);
    setMatchSelections(newSelections);
  };

  const handleMatchSubmit = () => {
    if (onAnswer && effectiveMatchPairs.length > 0) {
      const isCorrect = effectiveMatchPairs.every(pair =>
        matchSelections.get(pair.left) === pair.right
      );
      onAnswer(isCorrect);
    }
  };

  const handleOrderSelect = (item: string) => {
    if (orderSelections.includes(item)) {
      setOrderSelections(orderSelections.filter(i => i !== item));
    } else {
      setOrderSelections([...orderSelections, item]);
    }
  };

  const handleOrderSubmit = () => {
    if (onAnswer && effectiveOrderItems.length > 0) {
      const isCorrect = orderSelections.length === effectiveOrderItems.length &&
        orderSelections.every((item, idx) => item === effectiveOrderItems[idx]);
      onAnswer(isCorrect);
    }
  };

  // Flashcard - traditional question/answer
  if (question.type === "flashcard") {
    return (
      <div className="space-y-4">
        <MarkdownText className="text-lg sm:text-xl font-semibold break-words">
          {question.question}
        </MarkdownText>

        {question.imageUrl && (
          <img src={question.imageUrl} alt="Question" className="max-w-full w-full sm:max-w-md mx-auto rounded" />
        )}

        {mode === "answer-rating" && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <MarkdownText className="text-base sm:text-lg break-words">
              {question.answer}
            </MarkdownText>
          </div>
        )}
      </div>
    );
  }

  // Multiple Choice
  if (question.type === "multiple-choice") {
    return (
      <div className="space-y-4">
        <MarkdownText className="text-lg sm:text-xl font-semibold mb-4 break-words">
          {question.question}
        </MarkdownText>

        <div className="space-y-2">
          {question.options?.map((option, idx) => (
            <Button
              key={idx}
              variant={
                mode === "answer-rating"
                  ? option === question.answer
                    ? "default"
                    : selectedOption === option
                    ? "destructive"
                    : "outline"
                  : selectedOption === option
                  ? "default"
                  : "outline"
              }
              className="w-full text-left justify-start h-auto py-3 px-3 sm:px-4 break-words whitespace-normal"
              onClick={() => mode === "question" && handleMultipleChoiceSelect(option)}
              disabled={mode === "answer-rating"}
            >
              <MarkdownText className="block break-words">
                {option}
              </MarkdownText>
            </Button>
          ))}
        </div>

        {mode === "answer-rating" && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <strong>Correct Answer:</strong> {question.answer}
          </div>
        )}
      </div>
    );
  }

  // True/False
  if (question.type === "true-false") {
    return (
      <div className="space-y-6">
        <MarkdownText className="text-lg sm:text-xl font-semibold break-words">
          {question.question}
        </MarkdownText>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            size="lg"
            variant={mode === "answer-rating" ? (question.answer === "True" ? "default" : "outline") : "outline"}
            onClick={() => mode === "question" && handleTrueFalseSelect("True")}
            disabled={mode === "answer-rating"}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            True
          </Button>
          <Button
            size="lg"
            variant={mode === "answer-rating" ? (question.answer === "False" ? "default" : "outline") : "outline"}
            onClick={() => mode === "question" && handleTrueFalseSelect("False")}
            disabled={mode === "answer-rating"}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            False
          </Button>
        </div>

        {mode === "answer-rating" && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-center">
            <strong>Correct Answer:</strong> {question.answer}
          </div>
        )}
      </div>
    );
  }

  // Fill in the Blank
  if (question.type === "fill-in-blank") {
    return (
      <div className="space-y-4">
        <MarkdownText className="text-lg sm:text-xl font-semibold break-words">
          {question.question}
        </MarkdownText>

        {mode === "question" && (
          <>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={question.blanks && question.blanks.length > 1 ? "Separate answers with |" : "Type your answer"}
              className="w-full p-3 text-sm sm:text-base border border-border rounded-lg bg-background text-foreground"
            />
            <Button onClick={handleFillInBlankSubmit} className="w-full py-5 sm:py-2">
              Submit Answer
            </Button>
          </>
        )}

        {mode === "answer-rating" && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm font-semibold mb-2">Correct Answer(s):</div>
            <MarkdownText className="text-base sm:text-lg break-words">
              {question.answer}
            </MarkdownText>
          </div>
        )}
      </div>
    );
  }

  // Matching
  if (question.type === "matching") {
    const leftItems = effectiveMatchPairs.map(p => p.left);

    return (
      <div className="space-y-4">
        <MarkdownText className="text-lg sm:text-xl font-semibold break-words">
          {question.question}
        </MarkdownText>

        {mode === "question" && (
          <>
            <div className="space-y-3">
              {leftItems.map((left, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium min-w-[120px] text-sm sm:text-base">{left}</span>
                  <span className="text-muted-foreground">→</span>
                  <select
                    value={matchSelections.get(left) || ""}
                    onChange={(e) => handleMatchSelect(left, e.target.value)}
                    className="flex-1 p-2 text-sm border border-border rounded bg-background text-foreground"
                  >
                    <option value="">Select match...</option>
                    {shuffledItems.map((right, rIdx) => (
                      <option key={rIdx} value={right}>{right}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <Button onClick={handleMatchSubmit} className="w-full py-5 sm:py-2" disabled={matchSelections.size !== leftItems.length}>
              Submit Matches
            </Button>
          </>
        )}

        {mode === "answer-rating" && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm font-semibold mb-2">Correct Matches:</div>
            <div className="space-y-1">
              {effectiveMatchPairs.map((pair, idx) => (
                <div key={idx} className="text-sm sm:text-base">
                  <span className="font-medium">{pair.left}</span>
                  <span className="text-muted-foreground mx-2">→</span>
                  <span>{pair.right}</span>
                  {matchSelections.get(pair.left) === pair.right ? (
                    <span className="ml-2 text-green-500">✓</span>
                  ) : matchSelections.get(pair.left) ? (
                    <span className="ml-2 text-red-500">✗</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Ordering
  if (question.type === "ordering") {
    return (
      <div className="space-y-4">
        <MarkdownText className="text-lg sm:text-xl font-semibold break-words">
          {question.question}
        </MarkdownText>

        {mode === "question" && (
          <>
            <p className="text-sm text-muted-foreground">Click items in the correct order:</p>
            <div className="flex flex-wrap gap-2">
              {shuffledItems.map((item, idx) => (
                <Button
                  key={idx}
                  variant={orderSelections.includes(item) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleOrderSelect(item)}
                  className="relative"
                >
                  {orderSelections.includes(item) && (
                    <span className="absolute -top-2 -left-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {orderSelections.indexOf(item) + 1}
                    </span>
                  )}
                  {item}
                </Button>
              ))}
            </div>
            {orderSelections.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Your order:</p>
                <p className="text-sm">{orderSelections.join(" → ")}</p>
              </div>
            )}
            <Button onClick={handleOrderSubmit} className="w-full py-5 sm:py-2" disabled={orderSelections.length !== shuffledItems.length}>
              Submit Order
            </Button>
          </>
        )}

        {mode === "answer-rating" && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm font-semibold mb-2">Correct Order:</div>
            <p className="text-base sm:text-lg">{effectiveOrderItems.join(" → ")}</p>
            {orderSelections.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">Your answer:</p>
                <p className="text-sm">{orderSelections.join(" → ")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Multi-Select
  if (question.type === "multi-select") {
    return (
      <div className="space-y-4">
        <MarkdownText className="text-lg sm:text-xl font-semibold mb-4 break-words">
          {question.question}
        </MarkdownText>
        <p className="text-sm text-muted-foreground">Select all that apply:</p>

        <div className="space-y-2">
          {question.options?.map((option, idx) => {
            const isSelected = selectedOptions.has(option);
            const optionPrefix = option.charAt(0);
            const isCorrect = question.correctAnswers?.some(a => a.charAt(0) === optionPrefix);

            return (
              <Button
                key={idx}
                variant={
                  mode === "answer-rating"
                    ? isCorrect
                      ? "default"
                      : isSelected
                      ? "destructive"
                      : "outline"
                    : isSelected
                    ? "default"
                    : "outline"
                }
                className="w-full text-left justify-start h-auto py-3 px-3 sm:px-4 break-words whitespace-normal"
                onClick={() => mode === "question" && handleMultiSelectToggle(option)}
                disabled={mode === "answer-rating"}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary-foreground' : ''}`}>
                    {isSelected && <span className="text-xs">✓</span>}
                  </div>
                  <MarkdownText className="block break-words">
                    {option}
                  </MarkdownText>
                </div>
              </Button>
            );
          })}
        </div>

        {mode === "question" && (
          <Button onClick={handleMultiSelectSubmit} className="w-full py-5 sm:py-2" disabled={selectedOptions.size === 0}>
            Submit Selection
          </Button>
        )}

        {mode === "answer-rating" && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <strong>Correct Answers:</strong> {question.correctAnswers?.join(", ")}
          </div>
        )}
      </div>
    );
  }

  return null;
}
