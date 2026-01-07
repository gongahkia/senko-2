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

  // Process sections to extract Q&A pairs
  // Format: Q1 === A1\n\nQ2 === A2\n\nQ3 === ...
  // After splitting by ===:
  //   rawSections[0] = Q1
  //   rawSections[1] = A1\n\nQ2
  //   rawSections[2] = A2\n\nQ3
  //   ...
  const processedSections: string[] = [];

  for (let i = 0; i < rawSections.length; i++) {
    const section = rawSections[i];

    if (i === 0) {
      // First section is always just a question
      processedSections.push(section);
    } else {
      // All subsequent sections contain: Answer\n\nNextQuestion
      // Split by double newlines to separate answer from next question
      const parts = section.split(/\n\n+/);

      if (parts.length >= 2) {
        // Last part is likely the next question, everything else is the answer
        const lastPart = parts[parts.length - 1].trim();
        const answerParts = parts.slice(0, -1);
        const answer = answerParts.join('\n\n').trim();

        if (answer) {
          processedSections.push(answer);
        }
        // Add the next question (last part)
        processedSections.push(lastPart);
      } else {
        // Only one part - this is just the final answer with no following question
        processedSections.push(section);
      }
    }
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
    let matchPairs: { left: string; right: string }[] | undefined;
    let orderItems: string[] | undefined;
    let correctAnswers: string[] | undefined;

    // Flashcard: Check for [FC] prefix (or no prefix for backwards compatibility)
    if (questionText.startsWith("[FC]")) {
      type = "flashcard";
      question = questionText.substring(4).trim();
    }

    const isNewMC = /^Question\s*\d+:/.test(questionText) && /\n[A-Z]\./.test(questionText);

    if (isNewMC) {
      type = "multiple-choice";
      const lines = questionText.split('\n').filter(line => line.trim() !== '');
      question = lines[0].trim();
      options = lines.slice(1).map(line => line.trim());

      const correctOptionPrefix = answerText.trim().toUpperCase() + ".";
      const correctOption = options.find(opt => opt.toUpperCase().startsWith(correctOptionPrefix));

      if (correctOption) {
        answer = correctOption;
      } else {
        answer = answerText;
      }
    } else if (questionText.startsWith("[MC]")) {
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
    // Matching: Check for [MATCH] prefix
    else if (questionText.startsWith("[MATCH]")) {
      type = "matching";
      question = questionText.substring(7).trim();

      // Parse match pairs (format: left1 -> right1 | left2 -> right2)
      const pairs = answerText.split("|").map(pair => {
        const [left, right] = pair.split("->").map(s => s.trim());
        return { left: left || "", right: right || "" };
      }).filter(p => p.left && p.right);

      matchPairs = pairs;
      answer = pairs.map(p => `${p.left} → ${p.right}`).join(", ");
    }
    // Ordering: Check for [ORDER] prefix
    else if (questionText.startsWith("[ORDER]")) {
      type = "ordering";
      question = questionText.substring(7).trim();

      // Parse ordered items (format: item1 | item2 | item3)
      orderItems = answerText.split("|").map(item => item.trim()).filter(Boolean);
      answer = orderItems.join(" → ");
    }
    // Multi-Select: Check for [MS] prefix
    else if (questionText.startsWith("[MS]")) {
      type = "multi-select";
      question = questionText.substring(4).trim();

      // Parse options and correct answers (format: A) option1 \n B) option2 \n ... \n ANSWERS: A, B)
      const optionLines = answerText.split("\n").filter(line => line.trim());
      options = [];
      correctAnswers = [];

      for (const line of optionLines) {
        if (line.startsWith("ANSWERS:")) {
          // Parse multiple correct answers (format: ANSWERS: A, B, C)
          const answersStr = line.substring(8).trim();
          correctAnswers = answersStr.split(",").map(a => a.trim());
        } else if (/^[A-Z]\)/.test(line)) {
          options.push(line);
        }
      }

      answer = `Correct: ${correctAnswers.join(", ")}`;
    }

    questions.push({ type, question, answer, options, blanks, matchPairs, orderItems, correctAnswers });
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

  // Fix underscore blanks inside LaTeX that would be interpreted as subscripts
  // Replace ___ (3+ underscores) with \text{___} inside $...$ blocks
  result = result.replace(/\$([^$]+)\$/g, (_match, content) => {
    // Replace consecutive underscores with escaped version or placeholder
    const fixed = content.replace(/_{2,}/g, (underscores: string) => `\\text{${underscores}}`);
    return `$${fixed}$`;
  });
  
  // Same for display math $$...$$
  result = result.replace(/\$\$([^$]+)\$\$/g, (_match, content) => {
    const fixed = content.replace(/_{2,}/g, (underscores: string) => `\\text{${underscores}}`);
    return `$$${fixed}$$`;
  });

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

// Normalize a question to ensure all derived fields are populated
export function normalizeQuestion(q: QuestionItem): QuestionItem {
  const normalized = { ...q };
  
  // Normalize ordering questions
  if (q.type === "ordering" && (!q.orderItems || q.orderItems.length === 0) && q.answer) {
    normalized.orderItems = q.answer.split(/\s*(?:→|\|)\s*/).map(s => s.trim()).filter(Boolean);
  }
  
  // Normalize matching questions
  if (q.type === "matching" && (!q.matchPairs || q.matchPairs.length === 0) && q.answer) {
    const pairs = q.answer.split(/\s*(?:\||,)\s*/).map(pair => {
      const parts = pair.split(/\s*(?:→|->)\s*/);
      if (parts.length >= 2) {
        return { left: parts[0]?.trim() || "", right: parts[1]?.trim() || "" };
      }
      return { left: "", right: "" };
    }).filter(p => p.left && p.right);
    normalized.matchPairs = pairs;
  }
  
  // Normalize fill-in-blank questions
  if (q.type === "fill-in-blank" && (!q.blanks || q.blanks.length === 0) && q.answer) {
    normalized.blanks = q.answer.split(/\s*(?:\/|\|)\s*/).map(s => s.trim()).filter(Boolean);
  }
  
  // Normalize multi-select questions
  if (q.type === "multi-select") {
    // Extract correctAnswers from answer if not present
    if ((!q.correctAnswers || q.correctAnswers.length === 0) && q.answer) {
      // Answer format: "Correct: A, B, C" or "A, B, C" or "ANSWERS: A, B"
      let answersStr = q.answer;
      if (answersStr.toLowerCase().startsWith("correct:")) {
        answersStr = answersStr.substring(8).trim();
      } else if (answersStr.toLowerCase().startsWith("answers:")) {
        answersStr = answersStr.substring(8).trim();
      }
      normalized.correctAnswers = answersStr.split(/\s*,\s*/).map(a => a.trim()).filter(Boolean);
    }
  }
  
  return normalized;
}
