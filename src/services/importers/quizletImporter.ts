import { QuestionItem, Deck } from '@/types';

export interface QuizletImportResult {
  success: boolean;
  deck?: Deck;
  error?: string;
  warnings?: string[];
}

/**
 * Import deck from Quizlet CSV/TSV format
 * Quizlet typically exports as TSV (tab-separated values)
 * Format: Term\tDefinition
 * or with header: Term\tDefinition\tImage URL
 */
export function importFromQuizlet(content: string, deckName: string): QuizletImportResult {
  try {
    const lines = content.trim().split('\n');

    if (lines.length === 0) {
      return { success: false, error: 'File is empty' };
    }

    const questions: QuestionItem[] = [];
    const warnings: string[] = [];

    // Check if first line is a header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('term') && firstLine.includes('definition');
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Quizlet uses tabs as delimiters
      const parts = line.split('\t');

      if (parts.length < 2) {
        warnings.push(`Line ${i + 1}: Skipped (expected tab-separated values)`);
        continue;
      }

      const term = parts[0].trim();
      const definition = parts[1].trim();
      const imageUrl = parts[2]?.trim();

      if (!term || !definition) {
        warnings.push(`Line ${i + 1}: Skipped (empty term or definition)`);
        continue;
      }

      const question: QuestionItem = {
        type: 'flashcard',
        question: term,
        answer: definition,
      };

      // Add image if URL is provided and looks valid
      if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        question.imageUrl = imageUrl;
      }

      questions.push(question);
    }

    if (questions.length === 0) {
      return { success: false, error: 'No valid flashcards found' };
    }

    const deck: Deck = {
      id: `deck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: deckName,
      description: `Imported from Quizlet (${questions.length} cards)`,
      questions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return {
      success: true,
      deck,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse Quizlet file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Detect if content is likely from Quizlet
 * Returns confidence score 0-1
 */
export function detectQuizletFormat(content: string): number {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return 0;

  let score = 0;

  // Check for Quizlet header
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('term') && firstLine.includes('definition')) {
    score += 0.5;
  }

  // Check if content uses tabs (Quizlet's default)
  const tabCount = content.split('\t').length - 1;
  const commaCount = content.split(',').length - 1;
  if (tabCount > commaCount && tabCount >= lines.length) {
    score += 0.3;
  }

  // Check if lines have exactly 2 or 3 tab-separated values
  let validLines = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const parts = lines[i].split('\t');
    if (parts.length === 2 || parts.length === 3) {
      validLines++;
    }
  }
  score += (validLines / Math.min(5, lines.length)) * 0.2;

  return Math.min(1, score);
}
