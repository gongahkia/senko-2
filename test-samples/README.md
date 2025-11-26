# Import Test Samples

This directory contains sample files demonstrating the different import formats supported by Senko-2.

## Available Formats

### 1. CSV Format (`sample-csv.csv`)

**Format**: `Question, Answer, [Type]`

Supports comma-separated or tab-separated values with optional type column.

**Supported Types**:
- `flashcard` (default)
- `multiple-choice`
- `true-false`
- `fill-in-blank`

**Example**:
```csv
Question,Answer,Type
What is the capital of France?,Paris,flashcard
The sky is blue,true,true-false
```

### 2. Quizlet Format (`sample-quizlet.txt`)

**Format**: `Term	Definition	[Image URL]`

Tab-separated values (TSV) following Quizlet's export format.

**Example**:
```
Term	Definition
Photosynthesis	The process by which plants convert sunlight into energy
DNA	Deoxyribonucleic acid
```

### 3. Obsidian Markdown (`sample-obsidian.md`)

Supports multiple markdown-based flashcard formats:

**Format 1 - Q:/A:**
```markdown
Q: What is the Pythagorean theorem?
A: a² + b² = c²
```

**Format 2 - Question:/Answer:**
```markdown
Question: What is machine learning?
Answer: A subset of AI where systems learn from data
```

**Format 3 - Headings:**
```markdown
## What is blockchain?
A distributed ledger technology
```

### 4. Plain Text (`sample-text.txt`)

Supports various simple text formats:

**Dash separator**: `Question - Answer`
**Colon separator**: `Question: Answer`
**Pipe separator**: `Question | Answer`

**Double newline**:
```
Question here

Answer here
```

**Numbered**:
```
1. What is DNS?
Domain Name System
```

## Using the Samples

1. Open Senko-2
2. Click the Upload icon in the toolbar
3. Choose "Import File" mode
4. Select a format or use "Auto-detect"
5. Enter a deck name
6. Upload one of these sample files
7. Click Import

The auto-detect feature will analyze the file and choose the most appropriate format automatically.

## Notes

- All formats create flashcard-type questions by default
- CSV format supports specifying question types
- Empty lines and malformed entries will be skipped with warnings
- Markdown formatting is automatically cleaned in Obsidian imports
