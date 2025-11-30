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
  const rawSections = inputText
    .split(/\s*===\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Process all sections to properly extract Q&A pairs
  // The format is: Q1 === A1\n\nQ2 === A2\n\nQ3 === A3...
  const processedSections: string[] = [];

  let i = 0;
  while (i < rawSections.length) {
    const section = rawSections[i];

    // First section is always a question
    if (i === 0) {
      processedSections.push(section);
      i++;
      continue;
    }

    // All other sections are answers (potentially with embedded next question)
    // Split by double newlines to find paragraphs
    const parts = section.split(/\n\n+/);

    if (parts.length > 1) {
      // Check if last part looks like a question
      const lastPart = parts[parts.length - 1].trim();

      const isQuestion = lastPart.endsWith('?') ||
                        /^(What|How|Why|When|Where|Who|Which|Define|Describe|Explain|List|State|Differentiate|According to|In the context)/i.test(lastPart);

      if (isQuestion) {
        // Split: everything except last part is the answer
        const answer = parts.slice(0, -1).join('\n\n').trim();
        if (answer) {
          processedSections.push(answer);
        }
        // Last part is the next question
        processedSections.push(lastPart);
      } else {
        // All parts are the answer
        processedSections.push(section);
      }
    } else {
      // Single paragraph - could be just an answer, or just a question
      processedSections.push(section);
    }

    i++;
  }

  // Now pair them up: processedSections[0,1], processedSections[2,3], etc.
  for (let i = 0; i < processedSections.length - 1; i += 2) {
    if (i + 1 >= processedSections.length) break;

    const questionText = processedSections[i].trim();
    const answerText = processedSections[i + 1].trim();

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

// Parse and render markdown formatting
export function parseMarkdown(text: string): string {
  if (!text) return '';

  let result = text;

  // Handle numbered lists (must come before other processing to preserve structure)
  result = result.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="ml-4 list-decimal list-inside">$2</li>');

  // Handle bulleted lists (lines starting with - or *)
  result = result.replace(/^[-*]\s+(.+)$/gm, '<li class="ml-4 list-disc list-inside">$1</li>');

  // Wrap consecutive <li> tags in <ul> or <ol>
  result = result.replace(/(<li class="ml-4 list-disc list-inside">.*?<\/li>(\n|$))+/g, (match) => {
    return '<ul class="my-2 space-y-1">' + match + '</ul>';
  });
  result = result.replace(/(<li class="ml-4 list-decimal list-inside">.*?<\/li>(\n|$))+/g, (match) => {
    return '<ol class="my-2 space-y-1">' + match + '</ol>';
  });

  // Handle bold + italic (***text***)
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Handle bold (**text**)
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Handle italic (*text*)
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

  return result;
}
