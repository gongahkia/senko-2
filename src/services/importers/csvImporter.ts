import { QuestionItem, Deck } from '@/types';

export interface CSVImportResult {
  success: boolean;
  deck?: Deck;
  error?: string;
  warnings?: string[];
}

/**
 * Parse CSV content into rows
 * Handles both comma and tab delimiters
 */
function parseCSV(content: string): string[][] {
  const lines = content.trim().split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    // Try comma first, then tab
    let delimiter = ',';
    if (!line.includes(',') && line.includes('\t')) {
      delimiter = '\t';
    }

    // Simple CSV parsing (doesn't handle quoted commas)
    const cells = line.split(delimiter).map(cell => cell.trim());
    rows.push(cells);
  }

  return rows;
}

/**
 * Import deck from generic CSV format
 * Expected format: Question, Answer
 * or: Question, Answer, Type
 */
export function importFromCSV(content: string, deckName: string): CSVImportResult {
  try {
    const rows = parseCSV(content);

    if (rows.length === 0) {
      return { success: false, error: 'CSV file is empty' };
    }

    const questions: QuestionItem[] = [];
    const warnings: string[] = [];

    // Check if first row is a header
    const hasHeader = rows[0][0]?.toLowerCase().includes('question') ||
                      rows[0][0]?.toLowerCase().includes('front');
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];

      if (row.length < 2) {
        warnings.push(`Row ${i + 1}: Skipped (insufficient columns)`);
        continue;
      }

      const question = row[0]?.trim();
      const answer = row[1]?.trim();

      if (!question || !answer) {
        warnings.push(`Row ${i + 1}: Skipped (empty question or answer)`);
        continue;
      }

      // Determine type from third column if present
      const typeHint = row[2]?.toLowerCase().trim();
      let type: QuestionItem['type'] = 'flashcard';

      if (typeHint) {
        if (typeHint.includes('mc') || typeHint.includes('multiple')) {
          type = 'multiple-choice';
        } else if (typeHint.includes('tf') || typeHint.includes('true') || typeHint.includes('false')) {
          type = 'true-false';
        } else if (typeHint.includes('fib') || typeHint.includes('blank')) {
          type = 'fill-in-blank';
        }
      }

      questions.push({
        type,
        question,
        answer,
      });
    }

    if (questions.length === 0) {
      return { success: false, error: 'No valid questions found in CSV' };
    }

    const deck: Deck = {
      id: `deck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: deckName,
      description: `Imported from CSV (${questions.length} cards)`,
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
      error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
