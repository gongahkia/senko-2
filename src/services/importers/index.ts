import { Deck } from '@/types';
import { importFromCSV } from './csvImporter';
import { importFromQuizlet, detectQuizletFormat } from './quizletImporter';
import { importFromObsidian, detectObsidianFormat } from './obsidianImporter';
import { importFromText, detectTextFormat } from './textImporter';

export type ImportFormat = 'csv' | 'quizlet' | 'obsidian' | 'text' | 'auto';

export interface ImportResult {
  success: boolean;
  deck?: Deck;
  error?: string;
  warnings?: string[];
  detectedFormat?: string;
}

/**
 * Auto-detect the format of imported content
 */
export function detectImportFormat(content: string): ImportFormat {
  const scores = {
    quizlet: detectQuizletFormat(content),
    obsidian: detectObsidianFormat(content),
    text: detectTextFormat(content),
    csv: 0.5, // Default medium score for CSV
  };

  // Find format with highest confidence score
  let bestFormat: ImportFormat = 'csv';
  let highestScore = scores.csv;

  (Object.entries(scores) as [ImportFormat, number][]).forEach(([format, score]) => {
    if (score > highestScore) {
      highestScore = score;
      bestFormat = format;
    }
  });

  return bestFormat;
}

/**
 * Import deck from various formats
 * @param content - The file content to import
 * @param deckName - Name for the new deck
 * @param format - Format to use ('auto' will auto-detect)
 */
export function importDeck(
  content: string,
  deckName: string,
  format: ImportFormat = 'auto'
): ImportResult {
  try {
    // Auto-detect format if needed
    if (format === 'auto') {
      format = detectImportFormat(content);
    }

    // Import using appropriate importer
    let result: ImportResult;

    switch (format) {
      case 'quizlet':
        result = importFromQuizlet(content, deckName);
        break;

      case 'obsidian':
        result = importFromObsidian(content, deckName);
        break;

      case 'text':
        result = importFromText(content, deckName);
        break;

      case 'csv':
      default:
        result = importFromCSV(content, deckName);
        break;
    }

    // Add detected format to result
    return {
      ...result,
      detectedFormat: format,
    };
  } catch (error) {
    return {
      success: false,
      error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get file extension suggestion based on format
 */
export function getFileExtension(format: ImportFormat): string {
  switch (format) {
    case 'quizlet':
      return '.txt';
    case 'obsidian':
      return '.md';
    case 'text':
      return '.txt';
    case 'csv':
      return '.csv';
    default:
      return '';
  }
}

/**
 * Get format display name
 */
export function getFormatName(format: ImportFormat): string {
  switch (format) {
    case 'quizlet':
      return 'Quizlet';
    case 'obsidian':
      return 'Obsidian';
    case 'text':
      return 'Plain Text';
    case 'csv':
      return 'CSV';
    case 'auto':
      return 'Auto-detect';
    default:
      return 'Unknown';
  }
}

// Re-export individual importers for direct use
export { importFromCSV } from './csvImporter';
export { importFromQuizlet, detectQuizletFormat } from './quizletImporter';
export { importFromObsidian, detectObsidianFormat } from './obsidianImporter';
export { importFromText, detectTextFormat } from './textImporter';
