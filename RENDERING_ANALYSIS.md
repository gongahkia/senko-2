# Comprehensive Rendering Logic Analysis: Senko-2

**Analysis Date**: 2026-01-09
**Files Analyzed**: QuestionRenderer.tsx, utils.ts, types/index.ts, Recall.tsx
**Focus**: Question parsing, rendering, and identification logic

---

## Executive Summary

The Senko-2 question rendering system has **23 identified issues** across critical, high, and medium severity levels. The most concerning areas are:

1. **Type system inconsistencies** that can cause runtime failures
2. **State synchronization issues** in matching and ordering questions
3. **Fragile answer validation logic** across multiple question types
4. **Race conditions** in line drawing for matching questions
5. **Missing error handling and validation** in the parsing pipeline

---

## 🔴 CRITICAL ISSUES

### 1. Type System Inconsistency: `fill-in-blank` vs `fill-in-the-blank`

**Location**: `src/types/index.ts:3` vs `QuestionRenderer.tsx:343`

**Issue**: Type definition uses `"fill-in-blank"` but component checks for `"fill-in-the-blank"` in line 343.

```typescript
// types/index.ts:3
export type QuestionType = "fill-in-blank" | ...

// QuestionRenderer.tsx:343
if (question.type === "fill-in-the-blank") {  // ❌ Will NEVER match!
```

**Impact**: Fill-in-the-blank questions will **never render correctly** - they'll fall through to `return null` at line 745.

**Reproduction**:
```yaml
---
type: fill-in-blank
blanks: ["answer1", "answer2"]
---
Fill in the ___ and the ___
```
This question will render as a blank screen.

---

### 2. Matching Question Line Drawing Race Condition

**Location**: `QuestionRenderer.tsx:139-175`

**Issue**: The `useEffect` for line position calculation runs immediately with `requestAnimationFrame`, but DOM refs may not be populated yet.

```typescript
useEffect(() => {
  const updateLinePositions = () => {
    if (!matchContainerRef.current) return;  // Early return, but refs might still be empty

    matchSelections.forEach((right, left) => {
      const leftEl = leftItemRefs.current.get(left);   // ❌ May be undefined
      const rightEl = rightItemRefs.current.get(right); // ❌ May be undefined

      if (leftEl && rightEl) {  // Silently skips if refs not ready
        // Calculate line positions...
      }
    });
  }

  const animationFrameId = requestAnimationFrame(updateLinePositions);  // ❌ Runs immediately
  // ...
}, [matchSelections]);
```

**Problem Chain**:
1. Component renders, creates empty refs
2. `useEffect` fires, schedules `updateLinePositions` for next frame
3. Refs are populated during render commit phase
4. Next frame executes, but if refs aren't ready, lines don't render
5. No retry mechanism - lines may never appear

**Recent Fix Attempt** (commit 0957a94): Changed from `useLayoutEffect` to `useEffect`, which actually **worsened** the issue by increasing the timing gap.

**Reproduction**: Fast component mounting/unmounting (navigation between tabs) causes lines to disappear.

---

### 3. Ordering Question State Initialization Race

**Location**: `QuestionRenderer.tsx:46-63`

**Issue**: `orderSelections` state can be out of sync with `initialOrderItems` on first render.

```typescript
const initialOrderItems = useMemo(() => {
  if (question.type === "ordering" && shuffledItems.length > 0) {
    return [...shuffledItems];
  }
  return [];
}, [question.type, shuffledItems]);

useEffect(() => {
  // Reset state when question changes
  setOrderSelections(question.type === "ordering" ? initialOrderItems : []);
}, [question, initialOrderItems]);

const currentOrderItems = orderSelections.length > 0 ? orderSelections : initialOrderItems;
```

**Problem**:
- First render: `orderSelections = []` (initial state)
- `currentOrderItems = initialOrderItems` (fallback)
- User makes changes → `orderSelections` updates
- Question changes → `useEffect` fires → `orderSelections` resets
- **BUT** if `initialOrderItems` dependencies change without question changing, `orderSelections` stays stale

**Specific Scenario**:
```
1. Question loads, initialOrderItems = [A, B, C] (shuffled)
2. orderSelections is still [], so currentOrderItems = [A, B, C]
3. User drags B to position 0
4. orderSelections = [B, A, C]
5. Component re-renders (parent state change)
6. shuffledItems recalculates with different random order = [C, A, B]
7. initialOrderItems updates to [C, A, B]
8. useEffect DOESN'T fire (question object is same reference)
9. UI shows orderSelections = [B, A, C] but items are now rendered differently
```

---

### 4. Missing Type Guards in Question Rendering

**Location**: `QuestionRenderer.tsx:242-745`

**Issue**: No validation that required fields exist before rendering type-specific UI.

```typescript
if (question.type === "matching") {
  const leftItems = matchPairs.map(p => p.left);  // ❌ matchPairs might be undefined!
  const rightItems = shuffledItems;
```

**Crash Scenarios**:
- Matching question without `matchPairs` → `TypeError: Cannot read property 'map' of undefined`
- Ordering question without `orderItems` → renders empty UI with no feedback
- Multi-select without `options` → crashes on `.map()`

**Data that would crash the renderer**:
```typescript
{
  type: "matching",
  question: "Match these items",
  answer: "...",
  // matchPairs: undefined  ❌ Missing required field
}
```

---

### 5. Flashcard Type Mismatch in Recall Component

**Location**: `Recall.tsx:132`

**Issue**: Recall component assumes `currentCard.type` might be undefined and defaults to "flashcard", but types don't allow this.

```typescript
<QuestionRenderer
  question={{ ...currentCard, type: currentCard.type || "flashcard" }}  // ❌ Type mismatch
  mode={mode}
/>
```

**Problem**:
- `FlashCard` type extends `QuestionItem` which has `type: QuestionType` (required, non-nullable)
- The `|| "flashcard"` fallback suggests defensive programming against undefined
- This indicates a type system vs runtime mismatch
- Suggests questions in storage might have `type: undefined` or `type: null`

---

## 🟠 HIGH SEVERITY ISSUES

### 6. Multi-Select Answer Validation is Fragile

**Location**: `QuestionRenderer.tsx:97-106`

**Issue**: Validation compares only the first character of each option (case-insensitive).

```typescript
const handleMultiSelectSubmit = () => {
  if (onAnswer && correctAnswers.length > 0) {
    const selectedPrefixes = Array.from(selectedOptions).map(opt => opt.charAt(0).toUpperCase());
    const correctPrefixes = correctAnswers.map(a => a.charAt(0).toUpperCase());
    // Compare prefixes only ❌
```

**Problems**:
1. **Ambiguity**: Options starting with same letter are indistinguishable
   ```yaml
   options:
     - Apple
     - Apricot  # Both start with 'A'
     - Banana
   answers: [Apple, Apricot]
   ```
   User selecting "Apple" or "Apricot" is treated identically.

2. **Empty string handling**: `"".charAt(0)` returns `""`, not handled specially

3. **Non-letter prefixes**: Numbers, symbols handled inconsistently

4. **Assumption of format**: Assumes options are formatted like "A) Text" but doesn't enforce it

**Expected Format** (from import logic):
```
A) First option
B) Second option
```

But the type system allows:
```
First option
Second option
```

---

### 7. Fill-in-the-Blank Answer Comparison Issues

**Location**: `QuestionRenderer.tsx:78-85`

**Issue**: Case-insensitive, whitespace-trimmed comparison is too strict for some use cases.

```typescript
const handleFillInBlankSubmit = () => {
  if (onAnswer && blanks) {
    const userAnswers = userInput.split("|").map(a => a.trim().toLowerCase());
    const correctBlanks = blanks.map(a => a.toLowerCase());
    const isCorrect = userAnswers.length === correctBlanks.length &&
                      userAnswers.every((ans, idx) => ans === correctBlanks[idx]);
    onAnswer(isCorrect);
  }
};
```

**Problems**:

1. **No fuzzy matching**: "color" vs "colour" both wrong
2. **No partial credit**: If 2/3 blanks correct, entire answer marked wrong
3. **Strict ordering**: Blanks must be answered in exact order even if question doesn't require it
4. **No synonym support**: "big" vs "large" both wrong
5. **Whitespace in middle**: "New York" vs "NewYork" vs "New  York" all different

**Example Failure**:
```
Question: The capital of ___ is ___.
Correct: ["France", "Paris"]
User types: "france|Paris"  ❌ Wrong (lowercase 'f')
```

---

### 8. Matching Question Submit Button Logic Flaw

**Location**: `QuestionRenderer.tsx:503-509`

**Issue**: Submit button is disabled until ALL pairs are matched, preventing partial submission or correction.

```typescript
<Button
  onClick={(e) => { e.stopPropagation(); handleMatchSubmit(); }}
  className="w-full py-5 sm:py-2"
  disabled={matchSelections.size !== leftItems.length}  // ❌ Must match ALL
>
  Submit Matches ({matchSelections.size}/{leftItems.length} connected)
</Button>
```

**Problems**:
1. User can't submit to see which matches are correct so far
2. No way to "check my work" incrementally
3. If user misclicks and connects wrong pair, they must undo before seeing feedback
4. Forces completion even if user wants to skip

**UX Issue**: Other question types allow submission any time (multi-select can submit with 0 selections).

---

### 9. Shuffle Non-Determinism Breaks Testing

**Location**: `QuestionRenderer.tsx:36-44` & `utils.ts:32-39`

**Issue**: Fisher-Yates shuffle uses `Math.random()` with no seed, making behavior non-reproducible.

```typescript
const shuffledItems = useMemo(() => {
  if (question.type === "matching" && matchPairs.length > 0) {
    return shuffle(matchPairs.map(p => p.right));  // ❌ Different every render
  }
  // ...
}, [question.type, matchPairs, orderItems]);
```

**Problems**:
1. **Debugging**: Can't reproduce exact same ordering
2. **Testing**: Unit tests can't verify shuffle correctness
3. **User confusion**: Same question looks different each time, harder to learn patterns
4. **No seed option**: Can't make shuffle deterministic based on question ID

**Best Practice**: Use seeded random for reproducible shuffles (e.g., based on question hash).

---

### 10. Answer Display Inconsistency in Mode Switching

**Location**: Throughout QuestionRenderer.tsx

**Issue**: Answer display in `answer-rating` mode shows different information than what validation uses.

**Examples**:

**Multiple Choice** (lines 297-301):
```typescript
{mode === "answer-rating" && (
  <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
    <strong>Correct Answer:</strong> {question.answer}  // Shows full text
  </div>
)}
```
But validation at line 68 uses: `option === question.answer` (relies on exact match)

**Multi-Select** (lines 736-740):
```typescript
{mode === "answer-rating" && (
  <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
    <strong>Correct Answers:</strong> {correctAnswers.join(", ")}  // Shows answer array
  </div>
)}
```
But validation at lines 99-100 uses: `correctPrefixes = correctAnswers.map(a => a.charAt(0))` (only first character)

**Impact**: User sees "Correct: A, B, C" but system validated against "A", "B", "C" prefixes - confusing when wrong.

---

### 11. Ordering Question Drag-and-Drop Indices Can Desync

**Location**: `QuestionRenderer.tsx:186-217`

**Issue**: Drag state uses string item value, but drop logic uses index. Items can move during drag.

```typescript
const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
  e.preventDefault();
  if (draggedItem === null) return;

  const items = [...currentOrderItems];
  const dragIndex = items.indexOf(draggedItem);  // ❌ Searches for item by value

  if (dragIndex !== -1 && dragIndex !== dropIndex) {
    items.splice(dragIndex, 1);
    items.splice(dropIndex, 0, draggedItem);
    setOrderSelections(items);
  }
  // ...
}, [draggedItem, currentOrderItems]);
```

**Problem**: If `currentOrderItems` changes during drag (e.g., parent re-render), `dragIndex` becomes stale.

**Scenario**:
1. Start dragging item at index 2
2. Parent component re-renders (e.g., window resize, state update)
3. `currentOrderItems` recalculates from `orderSelections || initialOrderItems`
4. User drops at index 0
5. `items.indexOf(draggedItem)` now searches new array
6. If item moved or doesn't exist, returns -1, operation silently fails

---

### 12. Memory Leak in Matching Question Refs

**Location**: `QuestionRenderer.tsx:23-24, 463-464, 486-487`

**Issue**: Refs for left/right items are stored in Map but never cleaned up when items change.

```typescript
const leftItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
const rightItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

// Later in render:
{leftItems.map((left, idx) => (
  <div
    key={idx}
    ref={(el) => { if (el) leftItemRefs.current.set(left, el); }}  // ❌ Never removes old entries
```

**Problem**:
- When question changes, old item keys remain in Map
- Map grows unbounded if user studies many matching questions
- Stale refs take up memory
- Could cause incorrect line drawing if old keys match new keys

**Fix needed**: Clear refs on question change:
```typescript
useEffect(() => {
  leftItemRefs.current.clear();
  rightItemRefs.current.clear();
}, [question]);
```

---

## 🟡 MEDIUM SEVERITY ISSUES

### 13. YAML Parsing Error Handling is Silent

**Location**: `utils.ts:99-104`

**Issue**: Parse errors are only logged to console, user gets no feedback.

```typescript
questions.push(normalizeQuestion(newItem));
} catch (e) {
  console.error("Failed to parse question block:", e);  // ❌ Silent failure
  // Optionally, provide feedback to the user about the parsing error
}
```

**Problems**:
1. User imports 100 questions, 10 fail silently
2. No indication which blocks failed
3. No error messages in UI
4. Can't recover or fix data

**User Experience**: "I imported my file but only 90 questions loaded... where are the other 10?"

---

### 14. parseQuestions Doesn't Validate Required Fields

**Location**: `utils.ts:42-107`

**Issue**: Parser creates questions without validating type-specific required fields.

```typescript
const newItem: QuestionItem = {
  type,
  question,
  answer: metadata.answer || '',  // Empty string fallback, but should validate
  options: metadata.options || undefined,
  blanks: metadata.blanks || undefined,
  matchPairs: metadata.pairs ? ... : undefined,  // ❌ No validation that pairs exist for matching type
  orderItems: metadata.items || undefined,
  correctAnswers: metadata.answers || undefined,
};
```

**Missing Validations**:
- `multiple-choice` without `options` → crashes renderer
- `matching` without `matchPairs` → crashes renderer
- `ordering` without `orderItems` → renders empty with no error
- `fill-in-blank` without `blanks` → renders with no input fields
- `multi-select` without `correctAnswers` → submit always fails

**Should validate**:
```typescript
if (type === 'matching' && !metadata.pairs) {
  throw new Error(`Matching question missing pairs at block ${blockIndex}`);
}
```

---

### 15. normalizeQuestion Doesn't Actually Normalize All Cases

**Location**: `utils.ts:221-246`

**Issue**: Function is incomplete and has misleading name.

```typescript
export function normalizeQuestion(q: QuestionItem): QuestionItem {
  const normalized = { ...q };

  // Ensure basic fields are present
  normalized.type = normalized.type || 'flashcard';
  normalized.question = normalized.question || '';
  normalized.answer = normalized.answer || '';

  // Ensure complex fields are arrays if they exist
  if (normalized.options && !Array.isArray(normalized.options)) normalized.options = [];
  // ❌ If options is undefined, it stays undefined (should be [] for consistency)
```

**Issues**:
1. **Name vs behavior**: "normalize" suggests making uniform, but only fixes existing data
2. **Incomplete**: Doesn't ensure all required fields exist
3. **No validation**: Silently converts bad data to empty arrays
4. **Type safety**: TypeScript sees this as safe but runtime isn't

**Example**:
```typescript
normalizeQuestion({
  type: 'multiple-choice',
  question: 'Pick one',
  answer: 'A',
  // options: undefined  ❌ Stays undefined
})
// Returns: { ..., options: undefined }  → Crashes renderer
```

---

### 16. Image URL Type is Ambiguous

**Location**: `types/index.ts:9`

**Issue**: `imageUrl?: string` can be base64 OR URL, but code treats them differently.

```typescript
imageUrl?: string; // Optional base64 or URL for images
```

**Problems**:
1. No way to distinguish without parsing
2. Base64 strings are huge (can be 100KB+)
3. External URLs need CORS handling
4. No validation in parser
5. Storage uses localStorage (5-10MB total limit), base64 images eat this quickly

**Example Failure**:
```yaml
---
type: flashcard
---
Question text
===
Answer
# imageUrl: "not-a-valid-url-or-base64"  ❌ Accepted by type system
```

Image renders as broken with no error.

---

### 17. Multiple Choice Answer Normalization Logic is Incorrect

**Location**: `utils.ts:84-87` & `utils.ts:237-243`

**Issue**: Assumes multiple choice options start with answer letter, but this isn't enforced.

```typescript
// In parseQuestions:
if (newItem.type === 'multiple-choice' && newItem.options && newItem.answer) {
  const correctOpt = newItem.options.find(opt => opt.startsWith(newItem.answer as string));
  newItem.answer = correctOpt || String(newItem.answer);  // ❌ Falls back to original
}

// In normalizeQuestion:
if (normalized.type === 'multiple-choice') {
  const correctOption = normalized.options?.find(opt => opt.startsWith(String(normalized.answer)));
  if (correctOption) {
    normalized.answer = correctOption;  // ❌ Only updates if found
  }
}
```

**Problem Chain**:
1. YAML has `answer: "B"`
2. Options are `["First", "Second", "Third"]` (no letter prefixes)
3. `find` returns `undefined` (nothing starts with "B")
4. `answer` stays as `"B"`
5. Renderer compares selected option against `"B"` → always wrong

**Expected Format** (from import examples):
```yaml
options:
  - A) First option
  - B) Second option
```

But type system allows:
```yaml
options:
  - First option
  - Second option
answer: "First option"  # Should work, but normalized to look for "F"
```

---

### 18. Event Propagation stopPropagation Overuse

**Location**: Throughout QuestionRenderer.tsx (16+ occurrences)

**Issue**: `stopPropagation` on every interactive element might block necessary events.

**Examples**:
```typescript
// Line 271
<div className="space-y-2" onClick={(e) => e.stopPropagation()}>

// Line 353
<div
  className="space-y-4"
  onClick={(e) => e.stopPropagation()}
  onTouchEnd={(e) => e.stopPropagation()}  // ❌ Blocks touch events too
  onMouseDown={(e) => e.stopPropagation()}
>
```

**Problems**:
1. Blocks parent's flip-card handler (Recall.tsx:128-129)
2. Prevents analytics event tracking
3. Breaks custom event listeners at app level
4. `onTouchEnd` stop might prevent scroll on mobile
5. `onMouseDown` stop prevents text selection in some contexts

**Why it exists**: Recall component has click handler to flip card, but question interactions shouldn't flip.

**Better solution**: Check event target instead of stopping all propagation.

---

### 19. Matching Question Remove Match Has Poor UX

**Location**: `QuestionRenderer.tsx:465`

**Issue**: Clicking a matched left item removes the match, but this is confusing.

```typescript
onClick={() => isMatched ? handleRemoveMatch(left) : handleLeftItemClick(left)}
```

**UX Problems**:
1. **No confirmation**: Single click removes, easy to misclick
2. **No visual indicator**: No "remove" icon or button
3. **Mode overload**: Click means "select" OR "remove" depending on state
4. **Ambiguous**: User expects clicking matched item to deselect left, then reselect right

**Better UX**:
- Add separate "×" button to remove match
- Or make clicking matched item select it for re-matching (override existing)

---

### 20. Ordering Question Arrow Buttons and Drag Can Conflict

**Location**: `QuestionRenderer.tsx:598-621`

**Issue**: Arrow buttons inside draggable element can interfere with drag events.

```typescript
<div
  key={item}
  draggable  // ❌ Entire div is draggable
  onDragStart={(e) => handleDragStart(e, item)}
  // ...
>
  {/* ... */}
  <div className="flex flex-col gap-1">
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); moveItem(idx, 'up'); }}  // ❌ Click while dragging?
```

**Problems**:
1. Clicking arrow button can accidentally start drag
2. On mobile, touch-hold for drag might trigger button hover state
3. `stopPropagation` on button click might not prevent parent drag
4. No `draggable={false}` on buttons to prevent them from being drag handles

---

### 21. Flashcard Answer Format Unclear

**Location**: `utils.ts:65-67` & `QuestionRenderer.tsx:242-261`

**Issue**: Flashcard parsing splits by `===` but doesn't document this well.

```typescript
// For flashcards, content is "question===answer"
if (type === 'flashcard') {
  question = content.trim();
  // The actual answer is handled by the renderer by showing the back  ❌ Comment unclear
}
```

**Confusion**:
1. Comment says "content is question===answer" but code does `question = content.trim()`
2. No handling of the split - it happens earlier at line 50-52
3. If flashcard has no `===`, entire content becomes question, answer is from metadata
4. Parser accepts both formats but doesn't validate

**Example ambiguity**:
```yaml
---
type: flashcard
answer: "This is the answer"
---
What is the question?
===
This is also an answer?
```
Which answer is used? (Answer: content after ===, or if no ===, the metadata answer)

---

### 22. No Accessibility Labels on Interactive Elements

**Location**: Throughout QuestionRenderer.tsx

**Issue**: Missing `aria-label`, `aria-describedby`, and other a11y attributes.

**Examples**:
1. Matching question left/right items have no labels explaining interaction model
2. Ordering drag items have no `role="listitem"`
3. Rating buttons in Recall.tsx have no `aria-pressed` state
4. Submit buttons don't announce disabled state reason
5. Fill-in-blank input has no `aria-invalid` on wrong answer

**Impact**: Screen reader users can't understand:
- How to interact with matching questions
- Which answers are correct/incorrect
- Why buttons are disabled
- Current progress state

---

### 23. LaTeX Rendering Can Break Markdown

**Location**: `utils.ts:182-192`

**Issue**: Regex to protect underscores in LaTeX is fragile.

```typescript
// Fix underscore blanks inside LaTeX
result = result.replace(/\$([^$]+)\$/g, (_match, content) => {
  const fixed = content.replace(/_{2,}/g, (underscores: string) => `\\text{${underscores}}`);
  return `$${fixed}$`;
});
```

**Problems**:
1. Only handles 2+ underscores, single `_` in LaTeX still breaks (interpreted as italic)
2. Nested `$` in string literals break regex (`"price $5 or $10"`)
3. `[^$]+` is greedy, matches across multiple math blocks
4. Doesn't handle escaped `\$`
5. MathJax processes after markdown, so order matters

**Example Breakage**:
```
The equation $x_i = 5$ shows subscript.
```
Markdown sees `_i` as italic start, breaks rendering.

---