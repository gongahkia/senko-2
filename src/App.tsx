import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/contexts/ToastContext";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import { DeckSelector } from "@/components/DeckSelector";
const Questions = lazy(() => import("@/components/Questions"));
const Recall = lazy(() => import("@/components/Recall"));
const Statistics = lazy(() => import("@/components/Statistics"));
import { ImportExport } from "@/components/ImportExport";
const Settings = lazy(() => import("@/components/Settings"));
import { MathJaxContext } from "better-react-mathjax";
import { useDecks } from "@/hooks/useDecks";
import { useKeyboardBindings } from "@/hooks/useKeyboardBindings";
import { QuestionItem } from "@/types";
import { BookOpen, HelpCircle, Copy, Check, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const mathJaxConfig = {
  tex: {
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
    processEscapes: true,
    processEnvironments: true,
  },
  options: {
    skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
    enableMenu: false,
    renderActions: {
      addMenu: [],
      checkLoading: [],
    },
    ignoreHtmlClass: 'tex2jax_ignore',
    processHtmlClass: 'tex2jax_process',
  },
  startup: {
    typeset: false,
  },
  loader: {
    load: ['[tex]/noerrors'],
  },
};

function App() {
  const {
    decks,
    currentDeck,
    currentDeckId,
    createDeck,
    updateDeck,
    deleteDeck,
    setCurrentDeckId,
  } = useDecks();

  const [currentTab, setCurrentTab] = useState<"recall" | "questions" | "stats">("recall");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [deckSearchQuery, setDeckSearchQuery] = useState("");

  // Filter decks based on search query
  const filteredDecks = useMemo(() => {
    if (!deckSearchQuery.trim()) return decks;

    const query = deckSearchQuery.toLowerCase();
    return decks.filter(deck =>
      deck.name.toLowerCase().includes(query) ||
      deck.description?.toLowerCase().includes(query)
    );
  }, [decks, deckSearchQuery]);

  const handleSaveQuestions = (questions: QuestionItem[]) => {
    if (currentDeckId) {
      updateDeck(currentDeckId, { questions });
      setRefreshKey((k) => k + 1);
    }
  };

  const handleDeckImported = () => {
    setRefreshKey((k) => k + 1);
    window.location.reload();
  };

  const handleNavigate = useCallback((tab: "recall" | "questions" | "stats") => {
    setCurrentTab(tab);
  }, []);

  // Global keyboard bindings for tab navigation
  useKeyboardBindings({
    onNavigate: handleNavigate,
    enabled: !!currentDeck,
  });

  const questionFormatsDoc = [
    {
      type: "Flashcard",
      prefix: "type: flashcard",
      description: "Traditional question/answer format. Question and answer are separated by '==='.",
      format: `---
type: flashcard
---
What is the capital of France?
===
Paris`,
      prompt: `Generate flashcard questions for active recall study on the topic: [YOUR TOPIC HERE]

Please format your response EXACTLY as follows, using YAML front matter for each card:

---
type: flashcard
---
Question 1 text here
===
Answer 1 text here

---
type: flashcard
---
Question 2 text here
===
Answer 2 text here

Requirements:
- Generate 15-20 questions.
- Each card MUST start with a YAML block containing "type: flashcard".
- The YAML block MUST be enclosed in "---" separators.
- The question and answer MUST be separated by "===".
- Use LaTeX math notation where appropriate ($...$ for inline, $$...$$ for block).
- Separate each card block with a blank line.
- Do NOT add any extra formatting or commentary.

Example:
---
type: flashcard
---
What is the derivative of $x^2$?
===
The derivative of $x^2$ is $2x$, found using the power rule.`
    },
    {
      type: "Multiple Choice",
      prefix: "type: multiple-choice",
      description: "Single correct answer from multiple options. Good for testing recognition.",
      format: `---
type: multiple-choice
answer: B
options:
  - A) 3
  - B) 4
  - C) 5
  - D) 6
---
What is 2 + 2?`,
      prompt: `Generate multiple choice questions for active recall study on the topic: [YOUR TOPIC HERE]

Please format your response EXACTLY as follows, using YAML front matter for each card:

---
type: multiple-choice
answer: B # The correct option letter
options:
  - A) Option A
  - B) Option B
  - C) Option C
  - D) Option D
---
Question 1 text here

---
type: multiple-choice
answer: C
options:
  - A) Option A
  - B) Option B
  - C) Option C
  - D) Option D
---
Question 2 text here

Requirements:
- Generate 10-15 questions.
- Each card MUST have a YAML block with "type: multiple-choice", the correct "answer" letter, and a list of "options".
- Each question must have exactly 4 options.
- The question text comes AFTER the YAML block.
- Use LaTeX math notation where appropriate.
- Separate each card block with a blank line.

Example:
---
type: multiple-choice
answer: B
options:
  - A) $x$
  - B) $2x$
  - C) $x^2$
  - D) $2x^2$
---
What is the derivative of $x^2$?`
    },
    {
      type: "True/False",
      prefix: "type: true-false",
      description: "Binary choice questions. Great for testing factual recall.",
      format: `---
type: true-false
answer: False
---
The Earth is flat.`,
      prompt: `Generate true/false questions for active recall study on the topic: [YOUR TOPIC HERE]

Please format your response EXACTLY as follows, using YAML front matter for each card:

---
type: true-false
answer: True
---
Statement 1 that is either true or false.

---
type: true-false
answer: False
---
Statement 2 that is either true or false.

Requirements:
- Generate 15-20 questions.
- Each card MUST have a YAML block with "type: true-false" and the correct "answer" (True or False).
- The question statement comes AFTER the YAML block.
- Mix of true and false answers (roughly 50/50).
- Use LaTeX math notation where appropriate.
- Separate each card block with a blank line.

Example:
---
type: true-false
answer: True
---
The derivative of $x^2$ is $2x$.`
    },
    {
      type: "Fill in the Blank",
      prefix: "type: fill-in-the-blank",
      description: "Type the missing word(s). Use ___ for blanks in the question.",
      format: `---
type: fill-in-the-blank
blanks:
  - H2O
---
The chemical formula for water is ___.`,
      prompt: `Generate fill-in-the-blank questions for active recall study on the topic: [YOUR TOPIC HERE]

Please format your response EXACTLY as follows, using YAML front matter for each card:

---
type: fill-in-the-blank
blanks:
  - correct answer
---
Sentence with ___ representing the blank.

---
type: fill-in-the-blank
blanks:
  - mass
  - acceleration
---
Newton's Second Law states that Force equals ___ times ___.

Requirements:
- Generate 15-20 questions.
- Each card MUST have a YAML block with "type: fill-in-the-blank" and a list of "blanks" (the answers).
- Use ___ (three underscores) to indicate each blank in the question text.
- The question text comes AFTER the YAML block.
- Use LaTeX math notation where appropriate.
- Separate each card block with a blank line.

Example:
---
type: fill-in-the-blank
blanks:
  - $2x$
---
The derivative of $x^2$ is ___.`
    },
    {
      type: "Matching",
      prefix: "type: matching",
      description: "Connect items from two columns. Perfect for vocabulary or associations.",
      format: `---
type: matching
pairs:
  - France: Paris
  - Germany: Berlin
  - Japan: Tokyo
---
Match the countries to their capitals.`,
      prompt: `Generate matching questions for active recall study on the topic: [YOUR TOPIC HERE]

Please format your response EXACTLY as follows, using YAML front matter for each card:

---
type: matching
pairs:
  - Item1: Match1
  - Item2: Match2
  - Item3: Match3
---
Instruction for what to match.

Requirements:
- Generate 8-10 questions.
- Each card MUST have a YAML block with "type: matching" and a list of "pairs".
- Each pair should be in "Key: Value" format.
- The question instruction comes AFTER the YAML block.
- Use LaTeX math notation where appropriate.
- Separate each card block with a blank line.

Example:
---
type: matching
pairs:
  - $x^2$: $2x$
  - $x^3$: $3x^2$
  - $e^x$: $e^x$
---
Match the mathematical functions to their derivatives.`
    },
    {
      type: "Ordering",
      prefix: "type: ordering",
      description: "Arrange items in correct sequence. Ideal for processes or timelines.",
      format: `---
type: ordering
items:
  - World War I
  - World War II
  - Cold War
---
Arrange these events chronologically.`,
      prompt: `Generate ordering questions for active recall study on the topic: [YOUR TOPIC HERE]

Please format your response EXACTLY as follows, using YAML front matter for each card:

---
type: ordering
items:
  - First item
  - Second item
  - Third item
  - Fourth item
---
Instruction for how to order the items.

Requirements:
- Generate 8-10 questions.
- Each card MUST have a YAML block with "type: ordering" and a list of "items" in the CORRECT order.
- The question instruction comes AFTER the YAML block.
- Use LaTeX math notation where appropriate.
- Separate each card block with a blank line.

Example:
---
type: ordering
items:
  - Identify the outer function
  - Differentiate the outer function
  - Multiply by the derivative of the inner function
---
Arrange the steps of differentiation using the chain rule.`
    },
    {
      type: "Multi-Select",
      prefix: "type: multi-select",
      description: "Multiple correct answers. Common in certification-style exams.",
      format: `---
type: multi-select
answers:
  - A
  - C
options:
  - A) Red
  - B) Green
  - C) Blue
  - D) Yellow
---
Which are primary colors?`,
      prompt: `Generate multi-select questions for active recall study on the topic: [YOUR TOPIC HERE]

Please format your response EXACTLY as follows, using YAML front matter for each card:

---
type: multi-select
answers: # List of correct option letters
  - A
  - D
options:
  - A) Option A
  - B) Option B
  - C) Option C
  - D) Option D
---
Question where multiple answers are correct (select all that apply).

Requirements:
- Generate 10-12 questions.
- Each card MUST have a YAML block with "type: multi-select", a list of correct "answers", and a list of "options".
- The question text comes AFTER the YAML block.
- Use LaTeX math notation where appropriate.
- Separate each card block with a blank line.

Example:
---
type: multi-select
answers:
  - A
  - B
  - D
options:
  - A) $\\frac{d}{dx}(x^2) = 2x$
  - B) $\\frac{d}{dx}(e^x) = e^x$
  - C) $\\frac{d}{dx}(\\ln x) = x$
  - D) $\\frac{d}{dx}(\\sin x) = \\cos x$
---
Which of the following are valid derivatives? (Select all that apply)`
    }
  ];

  const [expandedFormat, setExpandedFormat] = useState<string | null>(null);
  const [copiedFormatPrompt, setCopiedFormatPrompt] = useState<string | null>(null);

  const copyFormatPrompt = (type: string, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedFormatPrompt(type);
    setTimeout(() => setCopiedFormatPrompt(null), 2000);
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        <MathJaxContext config={mathJaxConfig}>
          <ThemeProvider>
          <div className="container mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">せんこ 2</h1>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <ImportExport
                  currentDeckId={currentDeckId}
                  onDeckImported={handleDeckImported}
                />
                <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-full sm:max-w-3xl lg:max-w-5xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl">Quick Start Guide</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                      Learn active recall in 3 simple steps
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Quick Start Steps */}
                    <div className="grid gap-3 sm:gap-4">
                      <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">1</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-1 text-sm sm:text-base">Create a Deck</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">Click the + button to create your first deck for any subject</p>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">2</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-1 text-sm sm:text-base">Add Questions</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">Switch to Questions tab and paste or write your flashcards</p>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">3</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-1 text-sm sm:text-base">Start Studying</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">Return to Recall tab to begin your study session</p>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t" />

                    {/* Question Formats Documentation */}
                    <div className="space-y-4 sm:space-y-5">
                      <div>
                        <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                          Question Formats
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                          Click on a format to see examples and copy AI prompts:
                        </p>

                        <div className="space-y-2">
                          {questionFormatsDoc.map((format) => (
                            <div key={format.type} className="border rounded-lg overflow-hidden">
                              <button
                                onClick={() => setExpandedFormat(expandedFormat === format.type ? null : format.type)}
                                className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{format.prefix}</code>
                                  <span className="font-medium text-sm">{format.type}</span>
                                </div>
                                {expandedFormat === format.type ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>

                              {expandedFormat === format.type && (
                                <div className="p-3 space-y-3 border-t bg-background">
                                  <p className="text-xs sm:text-sm text-muted-foreground">{format.description}</p>

                                  <div>
                                    <p className="text-xs font-semibold mb-1">Format Example:</p>
                                    <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">{format.format}</pre>
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-xs font-semibold">AI Prompt:</p>
                                      <Button
                                        onClick={() => copyFormatPrompt(format.type, format.prompt)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs"
                                      >
                                        {copiedFormatPrompt === format.type ? (
                                          <>
                                            <Check className="h-3 w-3 mr-1" />
                                            Copied!
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="h-3 w-3 mr-1" />
                                            Copy
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">{format.prompt}</pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t" />

                      {/* Keyboard Shortcuts */}
                      <div>
                        <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                          ⌨️ Keyboard Shortcuts
                        </h4>
                        <div className="p-3 bg-muted/50 rounded-lg text-xs sm:text-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-background border rounded text-xs min-w-[60px] text-center">Space</kbd>
                            <span className="text-muted-foreground">Flip card to reveal answer</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-background border rounded text-xs min-w-[60px] text-center">1-4</kbd>
                            <span className="text-muted-foreground">Rate recall (1=Bad, 4=Easy)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-background border rounded text-xs min-w-[60px] text-center">Ctrl+Z</kbd>
                            <span className="text-muted-foreground">Undo last rating</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Suspense fallback={<LoadingSpinner />}>
                <Settings />
              </Suspense>
              </div>
            </div>

            {/* Deck Search */}
            {decks.length > 3 && (
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search decks..."
                    value={deckSearchQuery}
                    onChange={(e) => setDeckSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {deckSearchQuery && (
                    <button
                      onClick={() => setDeckSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {deckSearchQuery && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Showing {filteredDecks.length} of {decks.length} decks
                  </p>
                )}
              </div>
            )}

            <div className="w-full sm:w-auto">
              <DeckSelector
                decks={filteredDecks}
                currentDeckId={currentDeckId}
                onSelectDeck={setCurrentDeckId}
                onCreateDeck={createDeck}
                onDeleteDeck={deleteDeck}
              />
            </div>
          </div>

          {/* Main Content */}
          {!currentDeck ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">No Deck Selected</h2>
              <p className="text-muted-foreground mb-6">
                Create a new deck or select an existing one to get started
              </p>
              <Button onClick={() => setShowCreatePrompt(true)}>
                Create Your First Deck
              </Button>
            </div>
          ) : (
            <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as "recall" | "questions" | "stats")} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                <TabsTrigger value="recall" className="text-xs sm:text-sm">Recall</TabsTrigger>
                <TabsTrigger value="questions" className="text-xs sm:text-sm">Questions</TabsTrigger>
                <TabsTrigger value="stats" className="text-xs sm:text-sm">Statistics</TabsTrigger>
              </TabsList>

              <TabsContent value="recall" className="mt-6">
                <Suspense fallback={<div className="flex items-center justify-center p-8"><LoadingSpinner size="lg" /></div>}>
                  <Recall
                    key={`${currentDeckId}-${refreshKey}`}
                    deckId={currentDeck.id}
                    questions={currentDeck.questions}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="questions" className="mt-6">
                <Suspense fallback={<div className="flex items-center justify-center p-8"><LoadingSpinner size="lg" /></div>}>
                  <Questions
                    deckId={currentDeck.id}
                    initialQuestions={currentDeck.questions}
                    onSave={handleSaveQuestions}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="stats" className="mt-6">
                <Suspense fallback={<div className="flex items-center justify-center p-8"><LoadingSpinner size="lg" /></div>}>
                  <Statistics />
                </Suspense>
              </TabsContent>
            </Tabs>
          )}

          {/* Footer */}
          <footer className="mt-12 pt-8 pb-4 border-t border-border text-center text-sm text-muted-foreground">
            <p>
              Made by{" "}
              <a
                href="https://gabrielongzm.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Gabriel Ong
              </a>
              {" · "}
              <a
                href="https://github.com/gongahkia/senko-2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Source Code
              </a>
            </p>
          </footer>
          </div>
          </ThemeProvider>
        </MathJaxContext>

        <PromptDialog
          open={showCreatePrompt}
          onOpenChange={setShowCreatePrompt}
          title="Create New Deck"
          description="Enter a name for your new deck"
          label="Deck Name"
          placeholder="e.g., Math Formulas"
          onConfirm={createDeck}
          confirmText="Create"
          cancelText="Cancel"
        />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
