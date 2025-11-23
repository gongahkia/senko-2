import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { QuestionItem, QuestionType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate unique ID
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Format date for display
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

// Format date for storage (YYYY-MM-DD)
export function formatDateKey(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

// Calculate time difference in minutes
export function getMinutesDiff(start: number, end: number): number {
  return Math.floor((end - start) / 1000 / 60);
}

// Shuffle array (Fisher-Yates)
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Parse questions from text
export function parseQuestions(inputText: string): QuestionItem[] {
  if (!inputText.trim()) return [];

  const questions: QuestionItem[] = [];

  // Split by === delimiter
  const sections = inputText.split(/\n===\n/);

  for (let i = 0; i < sections.length - 1; i += 2) {
    if (i + 1 >= sections.length) break;

    const questionText = sections[i].trim();
    const answerText = sections[i + 1].trim();

    if (!questionText || !answerText) continue;

    // Detect question type based on format
    let type: QuestionType = "flashcard";
    let question = questionText;
    let answer = answerText;
    let options: string[] | undefined;
    let blanks: string[] | undefined;

    // Multiple choice: Check for [MC] prefix and options
    if (questionText.startsWith("[MC]")) {
      type = "multiple-choice";
      question = questionText.substring(4).trim();

      // Parse options from answer (format: A) option1 \n B) option2 \n ... \n ANSWER: A)
      const optionLines = answerText.split("\n").filter(line => line.trim());
      options = [];

      for (const line of optionLines) {
        if (line.startsWith("ANSWER:")) {
          answer = line.substring(7).trim();
        } else if (/^[A-Z]\)/.test(line)) {
          options.push(line);
        }
      }
    }
    // True/False: Check for [TF] prefix
    else if (questionText.startsWith("[TF]")) {
      type = "true-false";
      question = questionText.substring(4).trim();
      // Answer should be "True" or "False"
      answer = answerText.toLowerCase().includes("true") ? "True" : "False";
    }
    // Fill in blank: Check for [FIB] prefix and ___
    else if (questionText.startsWith("[FIB]")) {
      type = "fill-in-blank";
      question = questionText.substring(5).trim();

      // Parse multiple blanks if present (format: answer1 | answer2 | answer3)
      blanks = answerText.split("|").map(a => a.trim());
      answer = blanks.join(" / "); // Display format
    }

    questions.push({ type, question, answer, options, blanks });
  }

  return questions;
}

// Convert image file to base64
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Validate image file
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  return validTypes.includes(file.type) && file.size <= maxSize;
}
