/**
 * Represents the current state of an async operation
 * - idle: Operation not started
 * - loading: Operation in progress
 * - success: Operation completed successfully
 * - error: Operation failed
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Tracks the state and error of an async operation
 */
export interface AsyncOperation {
  state: LoadingState;
  error?: string;
}

/**
 * Global context for tracking various loading states in the application
 * Used for displaying loading indicators and handling async operations
 */
export interface LoadingContextValue {
  imageUpload: AsyncOperation;
  deckImport: AsyncOperation;
  deckLoad: AsyncOperation;
}
