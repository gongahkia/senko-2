import { useEffect, useRef } from "react";

type KeyboardMode = "default" | "vim" | "emacs";

interface KeyboardBindingsConfig {
  mode: KeyboardMode;
  onFlipCard?: () => void;
  onRate?: (rating: 1 | 2 | 3 | 4) => void;
  onNavigate?: (tab: "recall" | "questions" | "stats") => void;
  onNextCard?: () => void;
  onPreviousCard?: () => void;
  onUndo?: () => void;
  enabled?: boolean;
  currentMode?: "question" | "answer-rating";
}

export function useKeyboardBindings({
  mode,
  onFlipCard,
  onRate,
  onNavigate,
  onNextCard,
  onPreviousCard,
  onUndo,
  enabled = true,
  currentMode,
}: KeyboardBindingsConfig) {
  // Track pending Emacs two-key sequence listener to prevent memory leaks
  // When Ctrl+X is pressed, we attach a listener for the next key (r/q/s)
  // If component unmounts before the second key, listener must be cleaned up
  const pendingListenerRef = useRef<((event: KeyboardEvent) => void) | null>(null);

  // Timeout to auto-cleanup if user doesn't press second key within 3 seconds
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Clean up any pending listeners when disabled
      if (pendingListenerRef.current) {
        window.removeEventListener("keydown", pendingListenerRef.current);
        pendingListenerRef.current = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const cleanupPendingListener = () => {
      // Clear timeout first to prevent race conditions
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Then remove event listener
      if (pendingListenerRef.current) {
        window.removeEventListener("keydown", pendingListenerRef.current);
        pendingListenerRef.current = null;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Global shortcuts (work in all modes)
      // Undo with Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey && onUndo) {
        event.preventDefault();
        onUndo();
        return;
      }

      // Default mode - original behavior
      if (mode === "default") {
        if (event.code === "Space") {
          event.preventDefault();
          if (currentMode === "question" && onFlipCard) {
            onFlipCard();
          }
        }

        if (currentMode === "answer-rating" && ["1", "2", "3", "4"].includes(event.key) && onRate) {
          event.preventDefault();
          onRate(Number(event.key) as 1 | 2 | 3 | 4);
        }
      }

      // Vim mode
      if (mode === "vim") {
        // Flip card with Space or Enter
        if ((event.code === "Space" || event.key === "Enter") && !event.ctrlKey && !event.metaKey) {
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

        // Navigation
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey && onNavigate) {
          if (event.key === "h") {
            event.preventDefault();
            onNavigate("recall");
          } else if (event.key === "l") {
            event.preventDefault();
            onNavigate("questions");
          } else if (event.key === ";") {
            event.preventDefault();
            onNavigate("stats");
          }
        }

        // Next/Previous card
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
          if (event.key === "j" && onNextCard) {
            event.preventDefault();
            onNextCard();
          } else if (event.key === "k" && onPreviousCard) {
            event.preventDefault();
            onPreviousCard();
          }
        }
      }

      // Emacs mode
      if (mode === "emacs") {
        // Flip card with Space or Ctrl+M (Enter)
        if (event.code === "Space" && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          if (currentMode === "question" && onFlipCard) {
            onFlipCard();
          }
        }

        if (event.ctrlKey && event.key === "m") {
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

        // Navigation with Ctrl+X combinations
        if (event.ctrlKey && !event.metaKey && !event.shiftKey && onNavigate) {
          if (event.key === "x") {
            event.preventDefault();

            // Clean up any existing pending listener first
            cleanupPendingListener();

            // Wait for next key
            const handleNextKey = (nextEvent: KeyboardEvent) => {
              if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }

              if (nextEvent.key === "r") {
                nextEvent.preventDefault();
                onNavigate("recall");
              } else if (nextEvent.key === "q") {
                nextEvent.preventDefault();
                onNavigate("questions");
              } else if (nextEvent.key === "s") {
                nextEvent.preventDefault();
                onNavigate("stats");
              }
              pendingListenerRef.current = null;
            };

            pendingListenerRef.current = handleNextKey;
            window.addEventListener("keydown", handleNextKey, { once: true });

            // Auto-cleanup after 3 seconds if no key pressed
            timeoutRef.current = window.setTimeout(() => {
              if (pendingListenerRef.current) {
                cleanupPendingListener();
              }
            }, 3000);
          }
        }

        // Next/Previous card
        if (event.ctrlKey && !event.metaKey && !event.shiftKey) {
          if (event.key === "n" && onNextCard) {
            event.preventDefault();
            onNextCard();
          } else if (event.key === "p" && onPreviousCard) {
            event.preventDefault();
            onPreviousCard();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cleanupPendingListener();
    };
  }, [mode, enabled, currentMode, onFlipCard, onRate, onNavigate, onNextCard, onPreviousCard, onUndo]);
}
