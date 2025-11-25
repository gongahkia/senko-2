# Search/Filter Plan - Week 4.2

## Objective
Add search and filter functionality to help users quickly find decks and questions.

## Requirements
1. Search box to filter decks by name/description
2. Search box to filter questions by question/answer text
3. Real-time filtering as user types
4. Clear search button
5. Show count of filtered results
6. Keyboard shortcut to focus search (Ctrl+F / Cmd+F)

## Implementation Strategy

### App.tsx Changes
- Add search state for deck filtering
- Filter decks based on search query
- Pass filtered decks to components

### Questions Component Changes
- Add search input for question filtering
- Filter questions by question/answer text
- Show filtered count
- Clear search functionality

### UI/UX Considerations
- Search icon in input field
- Placeholder text guiding users
- Debouncing for performance (optional, may not be needed for small datasets)
- Responsive design for mobile
- Keyboard shortcut integration

## Search Algorithm
- Case-insensitive search
- Search in deck name and description
- Search in question text and answer text
- Use `.toLowerCase()` and `.includes()` for simple substring matching

## Files to Modify
- `src/App.tsx` - Deck search state and filtering
- `src/components/Questions.tsx` - Question search UI and filtering
- Optional: Add Input component if needed

## Commits Plan
1. Document search/filter plan
2. Add deck search state to App.tsx
3. Implement deck filtering logic
4. Add search input UI in App.tsx
5. Add question search state to Questions component
6. Implement question filtering logic
7. Add search input UI in Questions component
8. Add clear search buttons
9. Build and verify
10. Final summary

## Performance Notes
- No debouncing needed for small datasets
- Filter runs on every render (acceptable with useMemo if needed)
- Consider useMemo for expensive filtering operations
