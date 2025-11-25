# Performance Issues

## Statistics Component - Duplicate localStorage Reads

### Issue [RESOLVED]
Line 140 in Statistics.tsx calls `loadAppData()` inside the render loop for each deck.
This causes multiple localStorage reads even though data was already loaded in useMemo (line 7).

### Impact
- N localStorage reads where N = number of decks
- Unnecessary parsing of JSON data on every render
- Performance degrades with more decks

### Fix Applied
- Added deckName field to DeckStats type
- Store deck names in deckStats during useMemo calculation
- Remove duplicate loadAppData() call from render
- Statistics chunk reduced from 4.12 kB to 4.08 kB

### Resolution Date
2025-11-25
