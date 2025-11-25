import { useState, useMemo } from "react";
import { useToastContext } from "@/contexts/ToastContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MathJax } from "better-react-mathjax";
import { QuestionItem } from "@/types";
import { parseQuestions, imageToBase64, isValidImageFile } from "@/lib/utils";
import { Upload, Search, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface QuestionsProps {
  deckId: string;
  initialQuestions: QuestionItem[];
  onSave: (questions: QuestionItem[]) => void;
}

export function Questions({
  initialQuestions,
  onSave,
}: QuestionsProps) {
  const { showError } = useToastContext();
  const [text, setText] = useState(() => {
    // Convert questions back to text format
    return initialQuestions
      .map((q) => {
        const prefix = q.type === "multiple-choice" ? "[MC] " :
                      q.type === "true-false" ? "[TF] " :
                      q.type === "fill-in-blank" ? "[FIB] " : "";
        return `${prefix}${q.question}\n===\n${q.answer}`;
      })
      .join("\n\n");
  });
  const [parsedQuestions, setParsedQuestions] =
    useState<QuestionItem[]>(initialQuestions);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [questionSearchQuery, setQuestionSearchQuery] = useState("");

  // Filter questions based on search query
  const filteredQuestions = useMemo(() => {
    if (!questionSearchQuery.trim()) return parsedQuestions;

    const query = questionSearchQuery.toLowerCase();
    return parsedQuestions.filter(q =>
      q.question.toLowerCase().includes(query) ||
      q.answer.toLowerCase().includes(query)
    );
  }, [parsedQuestions, questionSearchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      const parsed = parseQuestions(text);
      setParsedQuestions(parsed);
      onSave(parsed);
      setIsSaving(false);
    }, 100);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      showError("Invalid image file. Please use JPG, PNG, GIF, or WEBP under 5MB.");
      return;
    }

    setUploadingIndex(index);
    try {
      const base64 = await imageToBase64(file);
      const updated = [...parsedQuestions];
      updated[index] = { ...updated[index], imageUrl: base64 };
      setParsedQuestions(updated);
      onSave(updated);
    } catch (error) {
      console.error("Failed to upload image:", error);
      showError("Failed to upload image");
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xl sm:text-2xl text-foreground">Questions for Active Recall</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-2">
        <Textarea
          id="question"
          placeholder="Type your questions here in the format: question\n===\nanswer\n\nSupports LaTeX math with $ and $$"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[40vh] sm:min-h-[50vh] resize-y font-mono text-sm sm:text-base"
        />
        <Button type="submit" disabled={isSaving} className="w-full sm:w-fit mt-2">
          {isSaving ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            "Save Questions"
          )}
        </Button>
      </form>

      {parsedQuestions.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <h3 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4">
            Parsed Questions ({parsedQuestions.length})
          </h3>

          {/* Question Search */}
          {parsedQuestions.length > 5 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={questionSearchQuery}
                  onChange={(e) => setQuestionSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {questionSearchQuery && (
                  <button
                    onClick={() => setQuestionSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {questionSearchQuery && (
                <p className="text-xs text-muted-foreground mt-1">
                  Showing {filteredQuestions.length} of {parsedQuestions.length} questions
                </p>
              )}
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            {filteredQuestions.map((item, index) => (
              <div
                key={index}
                className="border rounded-md p-3 sm:p-4 bg-card text-card-foreground"
              >
                <p className="font-medium text-sm sm:text-base">Question {index + 1}:</p>
                <p className="ml-3 sm:ml-4 mt-1 whitespace-pre-wrap text-sm sm:text-base">
                  <MathJax dynamic>{item.question}</MathJax>
                </p>
                <p className="font-medium mt-2 text-sm sm:text-base">Answer:</p>
                <p className="ml-3 sm:ml-4 mt-1 whitespace-pre-wrap text-sm sm:text-base">
                  <MathJax dynamic>{item.answer}</MathJax>
                </p>

                {item.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={item.imageUrl}
                      alt="Question diagram"
                      className="max-w-md rounded border"
                    />
                  </div>
                )}

                <div className="mt-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, index)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingIndex === index}
                      onClick={(e) =>
                        (e.currentTarget.previousSibling as HTMLInputElement)?.click()
                      }
                    >
                      {uploadingIndex === index ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-1" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3 mr-1" />
                          {item.imageUrl ? "Change Image" : "Add Image"}
                        </>
                      )}
                    </Button>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Questions;
