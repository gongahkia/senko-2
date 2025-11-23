/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Array of error messages if validation failed */
  errors: string[];
}

/**
 * Extended validation result for deck structure validation
 * Includes warnings for non-critical issues
 */
export interface DeckValidation extends ValidationResult {
  /** Array of warning messages for non-critical issues */
  warnings: string[];
}

/**
 * Validates if a string contains valid JSON
 * @param input - The string to validate
 * @returns ValidationResult with valid flag and any error messages
 */
export function isValidJSON(input: string): ValidationResult {
  const errors: string[] = [];

  if (!input || input.trim() === "") {
    errors.push("Input is empty");
    return { valid: false, errors };
  }

  try {
    JSON.parse(input);
    return { valid: true, errors: [] };
  } catch (e) {
    if (e instanceof SyntaxError) {
      errors.push(`Invalid JSON: ${e.message}`);
    } else {
      errors.push("Failed to parse JSON");
    }
    return { valid: false, errors };
  }
}

/**
 * Validates the structure of a deck object
 * Checks for required fields (id, name, questions) and validates
 * each question's structure. Returns both blocking errors and
 * non-blocking warnings for incomplete but parseable data.
 *
 * @param data - The parsed deck object to validate
 * @returns DeckValidation with valid flag, errors, and warnings
 */
export function validateDeckStructure(data: unknown): DeckValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Ensure data is an object
  if (typeof data !== "object" || data === null) {
    errors.push("Deck data must be an object");
    return { valid: false, errors, warnings };
  }

  const deck = data as Record<string, unknown>;

  // Validate required top-level fields
  if (!deck.id || typeof deck.id !== "string") {
    errors.push("Missing or invalid 'id' field");
  }

  if (!deck.name || typeof deck.name !== "string") {
    errors.push("Missing or invalid 'name' field");
  }

  if (!Array.isArray(deck.questions)) {
    errors.push("'questions' must be an array");
  } else {
    // Validate each question in the array
    deck.questions.forEach((q: unknown, index: number) => {
      if (typeof q !== "object" || q === null) {
        errors.push(`Question ${index + 1}: must be an object`);
        return;
      }

      const question = q as Record<string, unknown>;

      // Validate required question fields
      if (!question.question || typeof question.question !== "string") {
        errors.push(`Question ${index + 1}: missing or invalid 'question' field`);
      }

      if (!question.answer || typeof question.answer !== "string") {
        errors.push(`Question ${index + 1}: missing or invalid 'answer' field`);
      }

      // Validate optional type field
      if (question.type && typeof question.type !== "string") {
        errors.push(`Question ${index + 1}: invalid 'type' field`);
      }

      // Validate question type-specific fields (warnings only)
      // These are non-critical as questions can work without them
      if (question.type === "multiple-choice" && !Array.isArray(question.options)) {
        warnings.push(`Question ${index + 1}: multiple-choice type should have 'options' array`);
      }

      if (question.type === "fill-in-blank" && !Array.isArray(question.blanks)) {
        warnings.push(`Question ${index + 1}: fill-in-blank type should have 'blanks' array`);
      }
    });
  }

  // Return validation result
  // Valid only if no errors (warnings are acceptable)
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
