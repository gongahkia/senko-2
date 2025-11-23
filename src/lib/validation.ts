export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DeckValidation extends ValidationResult {
  warnings: string[];
}
