import { useEffect } from "react";

interface KeyboardBindingsConfig {
  onFlipCard?: () => void;
  onRate?: (rating: 1 | 2 | 3 | 4) => void;
  onNavigate?: (tab: "recall" | "questions" | "stats") => void;
  onUndo?: () => void;
  enabled?: boolean;
  currentMode?: "question" | "answer-rating";
}

export function useKeyboardBindings({
  onFlipCard,
  onRate,
  onNavigate,
  onUndo,
  enabled = true,
  currentMode,
}: KeyboardBindingsConfig) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field, textarea, or contenteditable element
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // If user is typing, only allow global shortcuts with modifiers (like Ctrl+Z)
      // but block all other shortcuts (Space, 1-4, navigation keys, etc.)
      if (isTyping) {
        // Allow Ctrl+Z/Cmd+Z for undo even when typing
        if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey && onUndo) {
          // Don't prevent default here - let the browser handle undo in input fields
          return;
        }
        // Block all other keyboard shortcuts when typing
        return;
      }

      // Global shortcuts (work in all modes)
      // Undo with Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey && onUndo) {
        event.preventDefault();
        onUndo();
        return;
      }

      // Flip card with Space
      if (event.code === "Space") {
        event.preventDefault();
        if (currentMode === "question" && onFlipCard) {
          onFlipCard();
        }
      }

      // Rate with 1-4
      if (currentMode === "answer-rating" && ["1", "2", "3", "4"].includes(event.key) && onRate) {
        event.preventDefault();
        onRate(Number(event.key) as 1 | 2 | 3 | 4);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, currentMode, onFlipCard, onRate, onNavigate, onUndo]);
}
