import { useState } from "react";
import { MathJax } from "better-react-mathjax";
import { Button } from "@/components/ui/button";
import { QuestionItem } from "@/types";

interface QuestionRendererProps {
  question: QuestionItem;
  mode: "question" | "answer-rating";
  onAnswer?: (isCorrect: boolean) => void;
}

export function QuestionRenderer({ question, mode, onAnswer }: QuestionRendererProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");

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

  // Flashcard - traditional question/answer
  if (question.type === "flashcard") {
    return (
      <div className="space-y-4">
        <div className="text-lg sm:text-xl font-semibold break-words">
          <MathJax>{question.question}</MathJax>
        </div>

        {question.imageUrl && (
          <img src={question.imageUrl} alt="Question" className="max-w-full w-full sm:max-w-md mx-auto rounded" />
        )}

        {mode === "answer-rating" && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="text-base sm:text-lg break-words">
              <MathJax>{question.answer}</MathJax>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Multiple Choice
  if (question.type === "multiple-choice") {
    return (
      <div className="space-y-4">
        <div className="text-lg sm:text-xl font-semibold mb-4 break-words">
          <MathJax>{question.question}</MathJax>
        </div>

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
              <span className="block break-words">
                <MathJax>{option}</MathJax>
              </span>
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
        <div className="text-lg sm:text-xl font-semibold break-words">
          <MathJax>{question.question}</MathJax>
        </div>

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
        <div className="text-lg sm:text-xl font-semibold break-words">
          <MathJax>{question.question}</MathJax>
        </div>

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
            <div className="text-base sm:text-lg break-words">
              <MathJax>{question.answer}</MathJax>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
