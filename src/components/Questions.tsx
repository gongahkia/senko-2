import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MathJax } from "better-react-mathjax";
import { QuestionItem } from "@/types";
import { parseQuestions, imageToBase64, isValidImageFile } from "@/lib/utils";
import { Upload } from "lucide-react";

interface QuestionsProps {
  deckId: string;
  initialQuestions: QuestionItem[];
  onSave: (questions: QuestionItem[]) => void;
}

export function Questions({
  initialQuestions,
  onSave,
}: QuestionsProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseQuestions(text);
    setParsedQuestions(parsed);
    onSave(parsed);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      alert("Invalid image file. Please use JPG, PNG, GIF, or WEBP under 5MB.");
      return;
    }

    try {
      const base64 = await imageToBase64(file);
      const updated = [...parsedQuestions];
      updated[index] = { ...updated[index], imageUrl: base64 };
      setParsedQuestions(updated);
      onSave(updated);
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
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
        <Button type="submit" className="w-full sm:w-fit mt-2">
          Save Questions
        </Button>
      </form>

      {parsedQuestions.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <h3 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4">
            Parsed Questions ({parsedQuestions.length})
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {parsedQuestions.map((item, index) => (
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
                      onClick={(e) =>
                        (e.currentTarget.previousSibling as HTMLInputElement)?.click()
                      }
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {item.imageUrl ? "Change Image" : "Add Image"}
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
