import { QuestionItem, Deck } from '@/types';

export interface TextImportResult {
  success: boolean;
  deck?: Deck;
  error?: string;
  warnings?: string[];
}

/**
 * Import deck from generic plain text format
 * Supports multiple common text flashcard formats:
 * 1. Double newline separated pairs (question\n\nanswer)
 * 2. Dash/colon separated (question - answer or question: answer)
 * 3. Numbered pairs (1. question / answer)
 */
export function importFromText(content: string, deckName: string): TextImportResult {
  try {
    const questions: QuestionItem[] = [];
    const warnings: string[] = [];

    // Try different parsing strategies
    const doubleNewlineCards = parseDoubleNewlineFormat(content);
    const separatorCards = parseSeparatorFormat(content);
    const numberedCards = parseNumberedFormat(content);

    // Use the strategy that found the most cards
    let parsedCards: Array<{ question: string; answer: string; line: number }> = [];

    if (doubleNewlineCards.length > parsedCards.length) {
      parsedCards = doubleNewlineCards;
    }
    if (separatorCards.length > parsedCards.length) {
      parsedCards = separatorCards;
    }
    if (numberedCards.length > parsedCards.length) {
      parsedCards = numberedCards;
    }

    if (parsedCards.length === 0) {
      return {
        success: false,
        error: 'No flashcards found. Supported formats: question/answer pairs separated by blank lines, " - ", or ": "'
      };
    }

    // Convert parsed cards to QuestionItems
    parsedCards.forEach(card => {
      const cleanQuestion = card.question.trim();
      const cleanAnswer = card.answer.trim();

      if (!cleanQuestion || !cleanAnswer) {
        warnings.push(`Line ${card.line}: Skipped (empty question or answer)`);
        return;
      }

      questions.push({
        type: 'flashcard',
        question: cleanQuestion,
        answer: cleanAnswer,
      });
    });

    if (questions.length === 0) {
      return { success: false, error: 'No valid flashcards found after parsing' };
    }

    const deck: Deck = {
      id: `deck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: deckName,
      description: `Imported from text file (${questions.length} cards)`,
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
      error: `Failed to parse text file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse double newline separated format
 * Example:
 * What is the capital of France?
 *
 * Paris
 *
 * What is 2+2?
 *
 * 4
 */
function parseDoubleNewlineFormat(content: string): Array<{ question: string; answer: string; line: number }> {
  const cards: Array<{ question: string; answer: string; line: number }> = [];

  // Split by double newlines (or more)
  const blocks = content.split(/\n\s*\n/);

  // Group consecutive blocks into question-answer pairs
  for (let i = 0; i < blocks.length - 1; i += 2) {
    const question = blocks[i].trim();
    const answer = blocks[i + 1]?.trim();

    if (question && answer) {
      cards.push({
        question,
        answer,
        line: i + 1
      });
    }
  }

  return cards;
}

/**
 * Parse separator format (dash or colon)
 * Example:
 * What is the capital of France? - Paris
 * What is 2+2?: 4
 */
function parseSeparatorFormat(content: string): Array<{ question: string; answer: string; line: number }> {
  const cards: Array<{ question: string; answer: string; line: number }> = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Try different separators
    let question = '';
    let answer = '';

    // Try " - " first (most common)
    if (line.includes(' - ')) {
      const parts = line.split(' - ');
      question = parts[0].trim();
      answer = parts.slice(1).join(' - ').trim(); // In case answer contains " - "
    }
    // Try ": " or " : "
    else if (line.match(/\s*:\s+/)) {
      const parts = line.split(/\s*:\s+/);
      question = parts[0].trim();
      answer = parts.slice(1).join(':').trim();
    }
    // Try " | " (pipe separator)
    else if (line.includes(' | ')) {
      const parts = line.split(' | ');
      question = parts[0].trim();
      answer = parts.slice(1).join(' | ').trim();
    }

    if (question && answer) {
      cards.push({
        question,
        answer,
        line: i + 1
      });
    }
  }

  return cards;
}

/**
 * Parse numbered format
 * Example:
 * 1. What is the capital of France?
 * Paris
 *
 * 2. What is 2+2?
 * 4
 */
function parseNumberedFormat(content: string): Array<{ question: string; answer: string; line: number }> {
  const cards: Array<{ question: string; answer: string; line: number }> = [];
  const lines = content.split('\n');

  let currentQuestion = '';
  let currentAnswer = '';
  let questionLine = 0;
  let inAnswer = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line starts with a number (e.g., "1.", "2)", "1:")
    const numberMatch = line.match(/^(\d+)[.):\s]+(.+)$/);

    if (numberMatch) {
      // Save previous card if exists
      if (currentQuestion && currentAnswer) {
        cards.push({
          question: currentQuestion,
          answer: currentAnswer.trim(),
          line: questionLine
        });
      }

      // Start new question
      currentQuestion = numberMatch[2];
      questionLine = i + 1;
      currentAnswer = '';
      inAnswer = true;
    } else if (line && inAnswer) {
      // Accumulate answer lines
      currentAnswer += (currentAnswer ? '\n' : '') + line;
    } else if (!line && inAnswer) {
      // Empty line marks end of answer
      if (currentQuestion && currentAnswer) {
        cards.push({
          question: currentQuestion,
          answer: currentAnswer.trim(),
          line: questionLine
        });
        currentQuestion = '';
        currentAnswer = '';
        inAnswer = false;
      }
    }
  }

  // Save last card
  if (currentQuestion && currentAnswer) {
    cards.push({
      question: currentQuestion,
      answer: currentAnswer.trim(),
      line: questionLine
    });
  }

  return cards;
}

/**
 * Detect if content is likely plain text flashcards
 * Returns confidence score 0-1
 */
export function detectTextFormat(content: string): number {
  let score = 0;

  // Check for double newlines (common in simple text files)
  const doubleNewlines = content.match(/\n\s*\n/g);
  if (doubleNewlines && doubleNewlines.length > 2) {
    score += 0.3;
  }

  // Check for separators
  const dashSeparators = content.match(/\s+-\s+/g);
  if (dashSeparators && dashSeparators.length > 0) {
    score += 0.4;
  }

  const colonSeparators = content.match(/\s*:\s+/g);
  if (colonSeparators && colonSeparators.length > 0) {
    score += 0.3;
  }

  // Check for numbered lists
  const numberedLines = content.match(/^\d+[.):\s]+/gm);
  if (numberedLines && numberedLines.length > 2) {
    score += 0.4;
  }

  // Penalize if it looks like CSV or TSV
  if (content.includes('\t') || content.match(/,/g)?.length || 0 > 10) {
    score -= 0.2;
  }

  // Penalize if it looks like markdown
  if (content.match(/^#{1,6}\s+/gm) || content.includes('**') || content.includes('](')) {
    score -= 0.1;
  }

  return Math.max(0, Math.min(1, score));
}
