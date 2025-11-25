# Undo Functionality Plan - Week 4.1

## Objective
Add undo functionality to allow users to undo their last rating during a study session.

## Requirements
1. Users should be able to undo their last rating
2. Only the most recent rating can be undone (no multi-level undo)
3. Undo should restore:
   - The flashcard queue state
   - Cards reviewed count
   - Cards mastered count
   - Ratings statistics
4. Undo button should be disabled when there's nothing to undo
5. Keyboard shortcut (Ctrl+Z / Cmd+Z) should trigger undo

## Implementation Strategy

### Hook Changes (useStudySession.ts)
- Add state to track previous session state
- Before each rating, save current state to undo stack
- Implement `undoLastRating()` function to restore previous state
- Export `canUndo` boolean to control UI state

### UI Changes (Recall.tsx)
- Add undo button next to rating buttons
- Disable undo button when `canUndo` is false
- Add keyboard shortcut for undo (Ctrl+Z)
- Style undo button to be visually distinct

### State to Track
```typescript
interface UndoState {
  flashcardQueue: FlashCard[];
  cardsReviewed: number;
  cardsMastered: number;
  ratings: { 1: number; 2: number; 3: number; 4: number };
}
```

## Edge Cases
- Undo after session completion should re-enable session
- Undo should clear itself after being used (can't undo twice in a row)
- Undo should be cleared when session is reset

## User Experience
- Undo button appears after first rating
- Visual feedback when undo is available
- Smooth state transition when undo is triggered
