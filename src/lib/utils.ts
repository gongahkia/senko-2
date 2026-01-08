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

// Simple string hash function for seeding
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Seeded random number generator (LCG algorithm)
function seededRandom(seed: number) {
  let state = seed;
  return function() {
    // Linear Congruential Generator parameters
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    state = (a * state + c) % m;
    return state / m;
  };
}

// Shuffle array (Fisher-Yates) with optional seed for deterministic behavior
export function shuffle<T>(array: T[], seed?: string): T[] {
  const shuffled = [...array];
  const random = seed ? seededRandom(hashString(seed)) : Math.random;

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface ParseResult {
  questions: QuestionItem[];
  errors: string[];
  warnings: string[];
}

// Validate type-specific required fields
function validateQuestionFields(question: QuestionItem, blockIndex: number): string[] {
  const errors: string[] = [];

  switch (question.type) {
    case 'multiple-choice':
      if (!question.options || question.options.length < 2) {
        errors.push(`Question ${blockIndex}: multiple-choice requires at least 2 options`);
      }
      break;
    case 'fill-in-the-blank':
      if (!question.blanks || question.blanks.length === 0) {
        errors.push(`Question ${blockIndex}: fill-in-the-blank requires at least 1 blank`);
      }
      break;
    case 'matching':
      if (!question.matchPairs || question.matchPairs.length === 0) {
        errors.push(`Question ${blockIndex}: matching requires at least 1 pair`);
      }
      break;
    case 'ordering':
      if (!question.orderItems || question.orderItems.length < 2) {
        errors.push(`Question ${blockIndex}: ordering requires at least 2 items`);
      }
      break;
    case 'multi-select':
      if (!question.options || question.options.length < 2) {
        errors.push(`Question ${blockIndex}: multi-select requires at least 2 options`);
      }
      if (!question.correctAnswers || question.correctAnswers.length === 0) {
        errors.push(`Question ${blockIndex}: multi-select requires at least 1 correct answer`);
      }
      break;
  }

  return errors;
}

// Parse questions from the new YAML front matter format
export function parseQuestions(inputText: string): ParseResult {
  if (!inputText.trim()) {
    return { questions: [], errors: [], warnings: [] };
  }

  const questions: QuestionItem[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const blocks = inputText.split(/^-{3,}\s*$/m).filter(block => block.trim());

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    try {
      const parts = block.trim().split(/\n===\n/);
      const frontMatterText = parts[0];
      const content = parts.length > 1 ? parts.slice(1).join('\n===\n') : '';

      const metadata = yaml.load(frontMatterText) as any;
      if (!metadata || typeof metadata !== 'object') {
        errors.push(`Block ${i + 1}: Invalid YAML format`);
        continue;
      }

      if (!metadata.type) {
        errors.push(`Block ${i + 1}: Missing 'type' field`);
        continue;
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

      if (!question) {
        errors.push(`Block ${i + 1}: Missing question text`);
        continue;
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

      // Validate type-specific fields
      const fieldErrors = validateQuestionFields(newItem, i + 1);
      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors);
        // Still add the question but mark as having errors
        warnings.push(`Block ${i + 1}: Question added but may not render correctly`);
      }

      // Validate image URL if present
      if (newItem.imageUrl) {
        const imageValidation = isValidImageUrl(newItem.imageUrl);
        if (!imageValidation.valid) {
          warnings.push(`Block ${i + 1}: Invalid image URL - ${imageValidation.error}`);
        }
      }

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
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      errors.push(`Block ${i + 1}: Parse error - ${errorMsg}`);
    }
  }

  return { questions, errors, warnings };
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

// Validate image URL (base64 or external URL)
export function isValidImageUrl(imageUrl: string): { valid: boolean; type: 'base64' | 'url' | 'invalid'; error?: string } {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return { valid: false, type: 'invalid', error: 'Image URL is empty or not a string' };
  }

  // Check if it's a base64 data URL
  const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
  if (base64Pattern.test(imageUrl)) {
    // Validate base64 format
    const base64Data = imageUrl.split(',')[1];
    if (!base64Data || base64Data.length === 0) {
      return { valid: false, type: 'invalid', error: 'Invalid base64 data' };
    }

    // Check approximate size (base64 is ~33% larger than binary)
    const approximateSize = (base64Data.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (approximateSize > maxSize) {
      return { valid: false, type: 'invalid', error: 'Base64 image exceeds 5MB limit' };
    }

    return { valid: true, type: 'base64' };
  }

  // Check if it's a valid HTTP(S) URL
  try {
    const url = new URL(imageUrl);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { valid: true, type: 'url' };
    }
    return { valid: false, type: 'invalid', error: 'URL must use http or https protocol' };
  } catch {
    return { valid: false, type: 'invalid', error: 'Invalid URL format' };
  }
}

// Parse and render markdown formatting
export function parseMarkdown(text: string): string {
  if (!text) return '';

  let result = text;

  // Protect LaTeX blocks from markdown processing
  // Store LaTeX blocks temporarily and restore them after markdown processing
  const latexBlocks: string[] = [];

  // Handle display math $$...$$ first (must come before inline math)
  result = result.replace(/\$\$([^$]+)\$\$/g, (_match, content) => {
    const placeholder = `__LATEX_DISPLAY_${latexBlocks.length}__`;
    latexBlocks.push(`$$${content}$$`);
    return placeholder;
  });

  // Handle inline math $...$ (non-greedy, doesn't match $$)
  result = result.replace(/\$([^$\n]+)\$/g, (_match, content) => {
    const placeholder = `__LATEX_INLINE_${latexBlocks.length}__`;
    latexBlocks.push(`$${content}$`);
    return placeholder;
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

  // Restore LaTeX blocks (reverse order to maintain indices)
  for (let i = latexBlocks.length - 1; i >= 0; i--) {
    result = result.replace(`__LATEX_DISPLAY_${i}__`, latexBlocks[i]);
    result = result.replace(`__LATEX_INLINE_${i}__`, latexBlocks[i]);
  }

  return result;
}

// Normalize a question to ensure all derived fields are populated correctly
export function normalizeQuestion(q: QuestionItem): QuestionItem {
  const normalized = { ...q };

  // Ensure basic fields are present
  normalized.type = normalized.type || 'flashcard';
  normalized.question = normalized.question || '';
  normalized.answer = normalized.answer || '';

  // Validate and clean image URL if present
  if (normalized.imageUrl) {
    const imageValidation = isValidImageUrl(normalized.imageUrl);
    if (!imageValidation.valid) {
      console.warn(`Invalid image URL removed: ${imageValidation.error}`);
      normalized.imageUrl = undefined;
    }
  }

  // Ensure complex fields are properly typed - initialize as undefined if not present
  // (Don't initialize as empty arrays - that would hide missing required fields)
  if (normalized.options !== undefined && !Array.isArray(normalized.options)) {
    normalized.options = [];
  }
  if (normalized.blanks !== undefined && !Array.isArray(normalized.blanks)) {
    normalized.blanks = [];
  }
  if (normalized.matchPairs !== undefined && !Array.isArray(normalized.matchPairs)) {
    normalized.matchPairs = [];
  }
  if (normalized.orderItems !== undefined && !Array.isArray(normalized.orderItems)) {
    normalized.orderItems = [];
  }
  if (normalized.correctAnswers !== undefined && !Array.isArray(normalized.correctAnswers)) {
    normalized.correctAnswers = [];
  }

  // Type-specific normalizations
  switch (normalized.type) {
    case 'multiple-choice':
      // Ensure the full answer text is stored, not just the letter
      if (normalized.options && normalized.answer) {
        const correctOption = normalized.options.find(opt =>
          opt.trim().toLowerCase().startsWith(String(normalized.answer).trim().toLowerCase())
        );
        if (correctOption) {
          normalized.answer = correctOption;
        }
      }
      break;

    case 'true-false':
      // Normalize boolean answers to string "True" or "False"
      if (normalized.answer === true || normalized.answer === 'true' || normalized.answer === 'True') {
        normalized.answer = 'True';
      } else if (normalized.answer === false || normalized.answer === 'false' || normalized.answer === 'False') {
        normalized.answer = 'False';
      }
      break;

    case 'fill-in-the-blank':
      // Ensure blanks are trimmed
      if (normalized.blanks) {
        normalized.blanks = normalized.blanks.map(b => String(b).trim());
      }
      break;

    case 'matching':
      // Ensure match pairs have string keys and values
      if (normalized.matchPairs) {
        normalized.matchPairs = normalized.matchPairs.map(pair => ({
          left: String(pair.left).trim(),
          right: String(pair.right).trim()
        }));
      }
      break;

    case 'ordering':
      // Ensure order items are trimmed strings
      if (normalized.orderItems) {
        normalized.orderItems = normalized.orderItems.map(item => String(item).trim());
      }
      break;

    case 'multi-select':
      // Ensure correct answers are trimmed
      if (normalized.correctAnswers) {
        normalized.correctAnswers = normalized.correctAnswers.map(a => String(a).trim());
      }
      break;
  }

  return normalized;
}
