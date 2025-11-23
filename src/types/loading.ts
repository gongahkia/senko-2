export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AsyncOperation {
  state: LoadingState;
  error?: string;
}

export interface LoadingContextValue {
  imageUpload: AsyncOperation;
  deckImport: AsyncOperation;
  deckLoad: AsyncOperation;
}
