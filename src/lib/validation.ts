export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DeckValidation extends ValidationResult {
  warnings: string[];
}

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

export function validateDeckStructure(data: unknown): DeckValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof data !== "object" || data === null) {
    errors.push("Deck data must be an object");
    return { valid: false, errors, warnings };
  }

  const deck = data as Record<string, unknown>;

  // Validate required fields
  if (!deck.id || typeof deck.id !== "string") {
    errors.push("Missing or invalid 'id' field");
  }

  if (!deck.name || typeof deck.name !== "string") {
    errors.push("Missing or invalid 'name' field");
  }

  if (!Array.isArray(deck.questions)) {
    errors.push("'questions' must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
