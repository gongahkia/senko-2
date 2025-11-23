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
