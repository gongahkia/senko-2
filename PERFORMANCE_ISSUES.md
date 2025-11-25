# Performance Issues

## Statistics Component - Duplicate localStorage Reads

### Issue
Line 140 in Statistics.tsx calls `loadAppData()` inside the render loop for each deck.
This causes multiple localStorage reads even though data was already loaded in useMemo (line 7).

### Impact
- N localStorage reads where N = number of decks
- Unnecessary parsing of JSON data on every render
- Performance degrades with more decks

### Fix
Store deck names in deckStats during useMemo calculation to avoid duplicate reads.
