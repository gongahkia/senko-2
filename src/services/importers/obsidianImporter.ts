import { QuestionItem, Deck } from '@/types';

export interface ObsidianImportResult {
  success: boolean;
  deck?: Deck;
  error?: string;
  warnings?: string[];
}

/**
 * Import deck from Obsidian markdown format
 * Supports multiple common flashcard syntaxes:
 * 1. Q: / A: format
 * 2. Question / Answer format
 * 3. ## heading as question, content as answer
 * 4. #flashcard tag format
 */
export function importFromObsidian(content: string, deckName: string): ObsidianImportResult {
  try {
    const questions: QuestionItem[] = [];
    const warnings: string[] = [];

    // Try different parsing strategies
    const qaFormatCards = parseQAFormat(content);
    const questionAnswerCards = parseQuestionAnswerFormat(content);
    const headingCards = parseHeadingFormat(content);

    // Use the strategy that found the most cards
    let parsedCards: Array<{ question: string; answer: string; line: number }> = [];

    if (qaFormatCards.length > parsedCards.length) {
      parsedCards = qaFormatCards;
    }
    if (questionAnswerCards.length > parsedCards.length) {
      parsedCards = questionAnswerCards;
    }
    if (headingCards.length > parsedCards.length) {
      parsedCards = headingCards;
    }

    if (parsedCards.length === 0) {
      return {
        success: false,
        error: 'No flashcards found. Supported formats: Q:/A:, Question/Answer, or ## Heading with content'
      };
    }

    // Convert parsed cards to QuestionItems
    parsedCards.forEach(card => {
      const cleanQuestion = cleanMarkdown(card.question);
      const cleanAnswer = cleanMarkdown(card.answer);

      if (!cleanQuestion || !cleanAnswer) {
        warnings.push(`Line ${card.line}: Skipped (empty question or answer after cleaning)`);
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
      description: `Imported from Obsidian (${questions.length} cards)`,
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
      error: `Failed to parse Obsidian file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse Q: / A: format
 * Example:
 * Q: What is the capital of France?
 * A: Paris
 */
function parseQAFormat(content: string): Array<{ question: string; answer: string; line: number }> {
  const cards: Array<{ question: string; answer: string; line: number }> = [];
  const lines = content.split('\n');

  let currentQuestion = '';
  let currentAnswer = '';
  let questionLine = 0;
  let inQuestion = false;
  let inAnswer = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.match(/^Q:/i)) {
      // Save previous card if exists
      if (currentQuestion && currentAnswer) {
        cards.push({ question: currentQuestion, answer: currentAnswer, line: questionLine });
      }
      // Start new question
      currentQuestion = line.replace(/^Q:\s*/i, '');
      questionLine = i + 1;
      inQuestion = true;
      inAnswer = false;
      currentAnswer = '';
    } else if (line.match(/^A:/i)) {
      currentAnswer = line.replace(/^A:\s*/i, '');
      inAnswer = true;
      inQuestion = false;
    } else if (line && inQuestion) {
      // Continue question on next line
      currentQuestion += ' ' + line;
    } else if (line && inAnswer) {
      // Continue answer on next line
      currentAnswer += ' ' + line;
    } else if (!line && (inQuestion || inAnswer)) {
      // Empty line - end of card
      if (currentQuestion && currentAnswer) {
        cards.push({ question: currentQuestion, answer: currentAnswer, line: questionLine });
        currentQuestion = '';
        currentAnswer = '';
        inQuestion = false;
        inAnswer = false;
      }
    }
  }

  // Save last card
  if (currentQuestion && currentAnswer) {
    cards.push({ question: currentQuestion, answer: currentAnswer, line: questionLine });
  }

  return cards;
}

/**
 * Parse Question / Answer format (case-insensitive)
 * Example:
 * Question: What is 2+2?
 * Answer: 4
 */
function parseQuestionAnswerFormat(content: string): Array<{ question: string; answer: string; line: number }> {
  const cards: Array<{ question: string; answer: string; line: number }> = [];
  const lines = content.split('\n');

  let currentQuestion = '';
  let currentAnswer = '';
  let questionLine = 0;
  let inQuestion = false;
  let inAnswer = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.match(/^Question:/i)) {
      // Save previous card if exists
      if (currentQuestion && currentAnswer) {
        cards.push({ question: currentQuestion, answer: currentAnswer, line: questionLine });
      }
      // Start new question
      currentQuestion = line.replace(/^Question:\s*/i, '');
      questionLine = i + 1;
      inQuestion = true;
      inAnswer = false;
      currentAnswer = '';
    } else if (line.match(/^Answer:/i)) {
      currentAnswer = line.replace(/^Answer:\s*/i, '');
      inAnswer = true;
      inQuestion = false;
    } else if (line && inQuestion) {
      currentQuestion += ' ' + line;
    } else if (line && inAnswer) {
      currentAnswer += ' ' + line;
    } else if (!line && (inQuestion || inAnswer)) {
      // Empty line - end of card
      if (currentQuestion && currentAnswer) {
        cards.push({ question: currentQuestion, answer: currentAnswer, line: questionLine });
        currentQuestion = '';
        currentAnswer = '';
        inQuestion = false;
        inAnswer = false;
      }
    }
  }

  // Save last card
  if (currentQuestion && currentAnswer) {
    cards.push({ question: currentQuestion, answer: currentAnswer, line: questionLine });
  }

  return cards;
}

/**
 * Parse heading format
 * Example:
 * ## What is the capital of France?
 * Paris is the capital of France.
 *
 * ## What is 2+2?
 * The answer is 4.
 */
function parseHeadingFormat(content: string): Array<{ question: string; answer: string; line: number }> {
  const cards: Array<{ question: string; answer: string; line: number }> = [];
  const lines = content.split('\n');

  let currentQuestion = '';
  let currentAnswer = '';
  let questionLine = 0;
  let inAnswer = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.match(/^##\s+/)) {
      // Save previous card if exists
      if (currentQuestion && currentAnswer) {
        cards.push({ question: currentQuestion, answer: currentAnswer.trim(), line: questionLine });
      }
      // Start new question
      currentQuestion = line.replace(/^##\s+/, '');
      questionLine = i + 1;
      currentAnswer = '';
      inAnswer = true;
    } else if (line && inAnswer) {
      // Accumulate answer lines
      currentAnswer += (currentAnswer ? '\n' : '') + line;
    }
  }

  // Save last card
  if (currentQuestion && currentAnswer) {
    cards.push({ question: currentQuestion, answer: currentAnswer.trim(), line: questionLine });
  }

  return cards;
}

/**
 * Clean markdown formatting from text
 * Removes: bold (**), italic (*), links, code blocks, etc.
 */
function cleanMarkdown(text: string): string {
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove list markers
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove multiple spaces and trim
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect if content is likely from Obsidian
 * Returns confidence score 0-1
 */
export function detectObsidianFormat(content: string): number {
  let score = 0;

  // Check for Q:/A: format
  const qaMatches = content.match(/Q:/gi);
  if (qaMatches && qaMatches.length > 0) {
    score += 0.4;
  }

  // Check for Question:/Answer: format
  const questionMatches = content.match(/Question:/gi);
  if (questionMatches && questionMatches.length > 0) {
    score += 0.3;
  }

  // Check for markdown headings
  const headingMatches = content.match(/^##\s+/gm);
  if (headingMatches && headingMatches.length > 0) {
    score += 0.2;
  }

  // Check for markdown formatting
  if (content.includes('**') || content.includes('[[') || content.includes('](')) {
    score += 0.1;
  }

  return Math.min(1, score);
}
