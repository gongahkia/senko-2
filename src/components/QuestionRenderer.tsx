import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedLeftItem, setSelectedLeftItem] = useState<string | null>(null);
  const matchContainerRef = useRef<HTMLDivElement>(null);
  const leftItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rightItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [linePositions, setLinePositions] = useState<{x1: number, y1: number, x2: number, y2: number, left: string, right: string}[]>([]);
  
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

  // Derive correctAnswers for multi-select
  const effectiveCorrectAnswers = useMemo(() => {
    if (question.correctAnswers && question.correctAnswers.length > 0) {
      return question.correctAnswers;
    }
    if (question.type === "multi-select" && question.answer) {
      let answersStr = question.answer;
      if (answersStr.toLowerCase().startsWith("correct:")) {
        answersStr = answersStr.substring(8).trim();
      } else if (answersStr.toLowerCase().startsWith("answers:")) {
        answersStr = answersStr.substring(8).trim();
      }
      return answersStr.split(/\s*,\s*/).map(a => a.trim()).filter(Boolean);
    }
    return [];
  }, [question.correctAnswers, question.type, question.answer]);

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

  // Initialize orderSelections with shuffled items for drag-and-drop
  const initialOrderItems = useMemo(() => {
    if (question.type === "ordering" && shuffledItems.length > 0) {
      return [...shuffledItems];
    }
    return [];
  }, [question.type, shuffledItems]);

  // Initialize orderSelections when the component mounts or question changes
  useEffect(() => {
    if (question.type === "ordering" && initialOrderItems.length > 0 && orderSelections.length === 0) {
      setOrderSelections([...initialOrderItems]);
    }
  }, [question.type, initialOrderItems, orderSelections.length]);

  // Use orderSelections directly (it gets initialized by the effect above)
  const currentOrderItems = orderSelections.length > 0 ? orderSelections : initialOrderItems;

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
    if (onAnswer && effectiveCorrectAnswers.length > 0) {
      const selectedPrefixes = Array.from(selectedOptions).map(opt => opt.charAt(0).toUpperCase());
      const correctPrefixes = effectiveCorrectAnswers.map(a => a.charAt(0).toUpperCase());
      const isCorrect = selectedPrefixes.length === correctPrefixes.length &&
        selectedPrefixes.every(s => correctPrefixes.includes(s)) &&
        correctPrefixes.every(c => selectedPrefixes.includes(c));
      onAnswer(isCorrect);
    }
  };

  // Click-based matching: click left item, then click right item to connect
  const handleLeftItemClick = (left: string) => {
    if (mode !== "question") return;
    if (selectedLeftItem === left) {
      setSelectedLeftItem(null); // Deselect if clicking same item
    } else {
      setSelectedLeftItem(left);
    }
  };

  const handleRightItemClick = (right: string) => {
    if (mode !== "question" || !selectedLeftItem) return;
    
    // Create the match
    const newSelections = new Map(matchSelections);
    // Remove any existing match to this right item (one-to-one matching)
    for (const [key, value] of newSelections) {
      if (value === right) {
        newSelections.delete(key);
      }
    }
    newSelections.set(selectedLeftItem, right);
    setMatchSelections(newSelections);
    setSelectedLeftItem(null);
  };

  // Remove a match by clicking on a connected left item
  const handleRemoveMatch = (left: string) => {
    if (mode !== "question") return;
    const newSelections = new Map(matchSelections);
    newSelections.delete(left);
    setMatchSelections(newSelections);
  };

  // Calculate line positions for SVG
  const updateLinePositions = useCallback(() => {
    if (!matchContainerRef.current) return;
    
    const containerRect = matchContainerRef.current.getBoundingClientRect();
    const newLines: {x1: number, y1: number, x2: number, y2: number, left: string, right: string}[] = [];
    
    matchSelections.forEach((right, left) => {
      const leftEl = leftItemRefs.current.get(left);
      const rightEl = rightItemRefs.current.get(right);
      
      if (leftEl && rightEl) {
        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();
        
        newLines.push({
          x1: leftRect.right - containerRect.left,
          y1: leftRect.top + leftRect.height / 2 - containerRect.top,
          x2: rightRect.left - containerRect.left,
          y2: rightRect.top + rightRect.height / 2 - containerRect.top,
          left,
          right
        });
      }
    });
    
    setLinePositions(newLines);
  }, [matchSelections]);

  // Update lines whenever matchSelections changes
  useEffect(() => {
    // Small delay to ensure refs are populated
    const timer = setTimeout(updateLinePositions, 50);
    // Also update on window resize
    window.addEventListener('resize', updateLinePositions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateLinePositions);
    };
  }, [updateLinePositions]);

  const handleMatchSubmit = () => {
    if (onAnswer && effectiveMatchPairs.length > 0) {
      const isCorrect = effectiveMatchPairs.every(pair =>
        matchSelections.get(pair.left) === pair.right
      );
      onAnswer(isCorrect);
    }
  };

  // Drag and drop handlers for ordering
  const handleDragStart = useCallback((e: React.DragEvent, item: string) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null) return;
    
    const items = [...currentOrderItems];
    const dragIndex = items.indexOf(draggedItem);
    
    if (dragIndex !== -1 && dragIndex !== dropIndex) {
      items.splice(dragIndex, 1);
      items.splice(dropIndex, 0, draggedItem);
      setOrderSelections(items);
    }
    
    setDraggedItem(null);
    setDragOverIndex(null);
  }, [draggedItem, currentOrderItems]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  // Move item up/down for non-drag interactions (mobile friendly)
  const moveItem = useCallback((index: number, direction: 'up' | 'down') => {
    const items = [...currentOrderItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < items.length) {
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      setOrderSelections(items);
    }
  }, [currentOrderItems]);

  const handleOrderSubmit = () => {
    if (onAnswer && effectiveOrderItems.length > 0) {
      const isCorrect = currentOrderItems.length === effectiveOrderItems.length &&
        currentOrderItems.every((item, idx) => item === effectiveOrderItems[idx]);
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

        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
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

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center" onClick={(e) => e.stopPropagation()}>
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
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              placeholder={question.blanks && question.blanks.length > 1 ? "Separate answers with |" : "Type your answer"}
              className="w-full p-3 text-sm sm:text-base border border-border rounded-lg bg-background text-foreground"
            />
            <Button onClick={(e) => { e.stopPropagation(); handleFillInBlankSubmit(); }} className="w-full py-5 sm:py-2">
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
    const rightItems = shuffledItems;

    return (
      <div className="space-y-4">
        <MarkdownText className="text-lg sm:text-xl font-semibold break-words">
          {question.question}
        </MarkdownText>

        {mode === "question" && (
          <>
            <p className="text-sm text-muted-foreground">Click an item on the left, then click its match on the right. Click a connected item to remove the match.</p>
            <div 
              ref={matchContainerRef}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* SVG overlay for drawing lines */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                style={{ overflow: 'visible' }}
              >
                {linePositions.map((line, idx) => (
                  <line
                    key={idx}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              
              {/* Two-column layout */}
              <div className="flex gap-4 sm:gap-8">
                {/* Left column */}
                <div className="flex-1 space-y-2">
                  {leftItems.map((left, idx) => {
                    const isMatched = matchSelections.has(left);
                    const isSelected = selectedLeftItem === left;
                    return (
                      <div
                        key={idx}
                        ref={(el) => { if (el) leftItemRefs.current.set(left, el); }}
                        onClick={() => isMatched ? handleRemoveMatch(left) : handleLeftItemClick(left)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-sm sm:text-base ${
                          isSelected 
                            ? 'border-primary bg-primary/10' 
                            : isMatched 
                              ? 'border-primary/50 bg-primary/5' 
                              : 'border-border bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        {left}
                      </div>
                    );
                  })}
                </div>
                
                {/* Right column */}
                <div className="flex-1 space-y-2">
                  {rightItems.map((right, idx) => {
                    const isMatched = Array.from(matchSelections.values()).includes(right);
                    return (
                      <div
                        key={idx}
                        ref={(el) => { if (el) rightItemRefs.current.set(right, el); }}
                        onClick={() => handleRightItemClick(right)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-sm sm:text-base ${
                          isMatched 
                            ? 'border-primary/50 bg-primary/5' 
                            : selectedLeftItem 
                              ? 'border-border bg-muted/50 hover:bg-primary/10 hover:border-primary' 
                              : 'border-border bg-muted/50'
                        }`}
                      >
                        {right}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <Button 
              onClick={(e) => { e.stopPropagation(); handleMatchSubmit(); }} 
              className="w-full py-5 sm:py-2" 
              disabled={matchSelections.size !== leftItems.length}
            >
              Submit Matches ({matchSelections.size}/{leftItems.length} connected)
            </Button>
          </>
        )}

        {mode === "answer-rating" && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm font-semibold mb-2">Correct Matches:</div>
            <div className="space-y-1">
              {effectiveMatchPairs.map((pair, idx) => (
                <div key={idx} className="text-sm sm:text-base flex items-center gap-2">
                  <span className="font-medium">{pair.left}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{pair.right}</span>
                  {matchSelections.get(pair.left) === pair.right ? (
                    <span className="text-green-500">✓</span>
                  ) : matchSelections.get(pair.left) ? (
                    <span className="text-red-500">✗ (You chose: {matchSelections.get(pair.left)})</span>
                  ) : (
                    <span className="text-red-500">✗ (Not answered)</span>
                  )}
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

        {mode === "question" && currentOrderItems.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">Drag and drop to arrange in correct order, or use arrows:</p>
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              {currentOrderItems.map((item, idx) => (
                <div
                  key={item}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-move transition-all ${
                    draggedItem === item 
                      ? 'opacity-50 border-primary bg-primary/10' 
                      : dragOverIndex === idx 
                        ? 'border-primary border-dashed bg-primary/5' 
                        : 'border-border bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm sm:text-base select-none">{item}</span>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveItem(idx, 'up'); }}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveItem(idx, 'down'); }}
                      disabled={idx === currentOrderItems.length - 1}
                      className="p-1 rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={(e) => { e.stopPropagation(); handleOrderSubmit(); }} className="w-full py-5 sm:py-2">
              Submit Order
            </Button>
          </>
        )}

        {mode === "question" && currentOrderItems.length === 0 && (
          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
            No items to order. Check the question format.
          </div>
        )}

        {mode === "answer-rating" && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
            <div>
              <div className="text-sm font-semibold mb-2">Correct Order:</div>
              <div className="space-y-1">
                {effectiveOrderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-500 text-xs flex items-center justify-center font-medium">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {currentOrderItems.length > 0 && (
              <div className="pt-3 border-t border-border">
                <div className="text-sm font-semibold mb-2">Your Answer:</div>
                <div className="space-y-1">
                  {currentOrderItems.map((item, idx) => {
                    const correctIdx = effectiveOrderItems.indexOf(item);
                    const isCorrectPosition = correctIdx === idx;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${
                          isCorrectPosition 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className={isCorrectPosition ? '' : 'text-muted-foreground'}>{item}</span>
                        {!isCorrectPosition && (
                          <span className="text-xs text-muted-foreground">(should be #{correctIdx + 1})</span>
                        )}
                        {isCorrectPosition && (
                          <span className="text-green-500">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
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

        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          {question.options?.map((option, idx) => {
            const isSelected = selectedOptions.has(option);
            const optionPrefix = option.charAt(0).toUpperCase();
            const isCorrect = effectiveCorrectAnswers.some(a => a.charAt(0).toUpperCase() === optionPrefix);

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
                onClick={(e) => { e.stopPropagation(); mode === "question" && handleMultiSelectToggle(option); }}
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
          <Button onClick={(e) => { e.stopPropagation(); handleMultiSelectSubmit(); }} className="w-full py-5 sm:py-2" disabled={selectedOptions.size === 0}>
            Submit Selection
          </Button>
        )}

        {mode === "answer-rating" && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <strong>Correct Answers:</strong> {effectiveCorrectAnswers.join(", ")}
          </div>
        )}
      </div>
    );
  }

  return null;
}
