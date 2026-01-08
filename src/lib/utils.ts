import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { QuestionItem, QuestionType } from "@/types";
import * as yaml from 'js-yaml';

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

// Parse questions from the new YAML front matter format
export function parseQuestions(inputText: string): QuestionItem[] {
  if (!inputText.trim()) return [];

  const questions: QuestionItem[] = [];
  const blocks = inputText.split(/^-{3,}\s*$/m).filter(block => block.trim());

  for (const block of blocks) {
    try {
      const parts = block.trim().split(/\n===\n/);
      const frontMatterText = parts[0];
      const content = parts.length > 1 ? parts.slice(1).join('\n===\n') : '';
      
      const metadata = yaml.load(frontMatterText) as any;
      if (!metadata || typeof metadata !== 'object' || !metadata.type) {
        continue; // Skip invalid blocks
      }

      const type = metadata.type as QuestionType;
      let question = '';
      let answer = '';

      // For flashcards, content is "question===answer"
      // For others, content is just the question
      if (type === 'flashcard') {
        question = content.trim();
        // The actual answer is handled by the renderer by showing the back
      } else {
        question = content.trim();
      }

      const newItem: QuestionItem = {
        type,
        question,
        answer: metadata.answer || '',
        options: metadata.options || undefined,
        blanks: metadata.blanks || undefined,
        matchPairs: metadata.pairs ? Object.entries(metadata.pairs).map(([left, right]) => ({ left: String(left), right: String(right) })) : undefined,
        orderItems: metadata.items || undefined,
        correctAnswers: metadata.answers || undefined,
      };

      // Post-process to generate a display answer for complex types
      if (newItem.type === 'multiple-choice' && newItem.options && newItem.answer) {
        const correctOpt = newItem.options.find(opt => opt.startsWith(newItem.answer as string));
        newItem.answer = correctOpt || String(newItem.answer);
      } else if (newItem.type === 'true-false') {
        newItem.answer = String(metadata.answer);
      } else if (newItem.type === 'fill-in-the-blank' && newItem.blanks) {
        newItem.answer = newItem.blanks.join(' / ');
      } else if (newItem.type === 'matching' && newItem.matchPairs) {
        newItem.answer = newItem.matchPairs.map(p => `${p.left} → ${p.right}`).join(', ');
      } else if (newItem.type === 'ordering' && newItem.orderItems) {
        newItem.answer = newItem.orderItems.join(' → ');
      } else if (newItem.type === 'multi-select' && newItem.correctAnswers) {
        newItem.answer = `Correct: ${newItem.correctAnswers.join(', ')}`;
      }

      questions.push(normalizeQuestion(newItem));
    } catch (e) {
      console.error("Failed to parse question block:", e);
      // Optionally, provide feedback to the user about the parsing error
    }
  }

  return questions;
}

// Convert an array of QuestionItems back to the YAML string format
export function stringifyQuestions(questions: QuestionItem[]): string {
  return questions.map(q => {
    const metadata: any = { type: q.type };
    let content = q.question;

    if (q.type === 'flashcard') {
      content = `${q.question}\n===\n${q.answer}`;
    }
    if (q.type === 'multiple-choice') {
      const answerLetter = typeof q.answer === 'string' ? q.answer.charAt(0) : '';
      metadata.answer = answerLetter;
      metadata.options = q.options;
    }
    if (q.type === 'true-false') {
      metadata.answer = q.answer;
    }
    if (q.type === 'fill-in-the-blank') {
      metadata.blanks = q.blanks;
    }
    if (q.type === 'matching' && q.matchPairs) {
      metadata.pairs = q.matchPairs.reduce((acc, pair) => {
        acc[pair.left] = pair.right;
        return acc;
      }, {} as Record<string, string>);
    }
    if (q.type === 'ordering') {
      metadata.items = q.orderItems;
    }
    if (q.type === 'multi-select') {
      metadata.answers = q.correctAnswers;
      metadata.options = q.options;
    }
    
    // Remove null/undefined fields from metadata
    Object.keys(metadata).forEach(key => {
      if (metadata[key] === undefined || metadata[key] === null) {
        delete metadata[key];
      }
    });

    const yamlText = yaml.dump(metadata, { skipInvalid: true });

    return `---\n${yamlText}---\n${content}`;
  }).join('\n\n');
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

// Normalize a question to ensure all derived fields are populated correctly
export function normalizeQuestion(q: QuestionItem): QuestionItem {
  const normalized = { ...q };

  // Ensure basic fields are present
  normalized.type = normalized.type || 'flashcard';
  normalized.question = normalized.question || '';
  normalized.answer = normalized.answer || '';

  // Ensure complex fields are arrays if they exist
  if (normalized.options && !Array.isArray(normalized.options)) normalized.options = [];
  if (normalized.blanks && !Array.isArray(normalized.blanks)) normalized.blanks = [];
  if (normalized.matchPairs && !Array.isArray(normalized.matchPairs)) normalized.matchPairs = [];
  if (normalized.orderItems && !Array.isArray(normalized.orderItems)) normalized.orderItems = [];
  if (normalized.correctAnswers && !Array.isArray(normalized.correctAnswers)) normalized.correctAnswers = [];

  // Specific normalizations
  if (normalized.type === 'multiple-choice') {
    // Ensure the full answer text is stored, not just the letter
    const correctOption = normalized.options?.find(opt => opt.startsWith(String(normalized.answer)));
    if (correctOption) {
      normalized.answer = correctOption;
    }
  }
  
  return normalized;
}
