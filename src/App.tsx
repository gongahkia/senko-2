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
import { Onboarding } from "@/components/Onboarding";
import { MathJaxContext } from "better-react-mathjax";
import { useDecks } from "@/hooks/useDecks";
import { useKeyboardBindings } from "@/hooks/useKeyboardBindings";
import { StudyMode, QuestionItem } from "@/types";
import { BookOpen, HelpCircle, Copy, Check, Sparkles, Keyboard, Zap, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type KeyboardMode = "default" | "vim" | "emacs";
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

  const [studyMode, setStudyMode] = useState<StudyMode>("normal");
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>("default");
  const [currentTab, setCurrentTab] = useState<"recall" | "questions" | "stats">("recall");
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
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
    mode: keyboardMode,
    onNavigate: handleNavigate,
    enabled: !!currentDeck,
  });

  const promptTemplate = `Generate flashcard questions and answers for active recall study on the topic: [YOUR TOPIC HERE]

Please format your response EXACTLY as follows:

Question 1 text here
===
Answer 1 text here

Question 2 text here
===
Answer 2 text here

Requirements:
- Generate 15-20 questions
- Questions should test understanding, not just memorization
- Answers should be concise but complete
- Use LaTeX math notation where appropriate ($...$ for inline, $$...$$ for block)
- Separate each question-answer pair with a blank line
- Do NOT number the questions
- Do NOT add any extra formatting or commentary

Example:
What is the derivative of $x^2$?
===
The derivative of $x^2$ is $2x$, found using the power rule.

What is Newton's Second Law?
===
Newton's Second Law states that $F = ma$, where force equals mass times acceleration.`;

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(promptTemplate);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
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
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">senko-2</h1>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" data-onboarding="help">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Quick Start Guide</DialogTitle>
                    <DialogDescription>
                      Learn active recall in 3 simple steps
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Quick Start Steps */}
                    <div className="grid gap-4">
                      <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">Create a Deck</h4>
                          <p className="text-sm text-muted-foreground">Click the + button to create your first deck for any subject</p>
                        </div>
                      </div>

                      <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">Add Questions</h4>
                          <p className="text-sm text-muted-foreground">Switch to Questions tab and paste or write your flashcards</p>
                        </div>
                      </div>

                      <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">Start Studying</h4>
                          <p className="text-sm text-muted-foreground">Return to Recall tab and use <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Space</kbd> to flip cards and <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">1-4</kbd> to rate yourself</p>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t" />

                    {/* Detailed Sections */}
                    <div className="space-y-5">
                      {/* Question Format */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Question Format
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Separate each question and answer with <code className="px-1.5 py-0.5 bg-muted rounded text-xs">===</code> on its own line:
                        </p>
                        <div className="bg-muted/70 p-4 rounded-lg border">
                          <pre className="font-mono text-xs leading-relaxed">
What is the formula for the area of a circle?
===
The area is $A = \pi r^2$ where $r$ is the radius.

What is the quadratic formula?
===
{"$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"}
                          </pre>
                        </div>
                      </div>

                      {/* LLM Template */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Generate with AI
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Use this prompt with ChatGPT, Claude, or any LLM:
                        </p>
                        <div className="relative">
                          <div className="bg-muted/70 p-4 rounded-lg border font-mono text-xs max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                            {promptTemplate}
                          </div>
                          <Button
                            onClick={copyPromptToClipboard}
                            size="sm"
                            variant="secondary"
                            className="absolute top-2 right-2 shadow-md"
                          >
                            {copiedPrompt ? (
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
                      </div>

                      {/* Keyboard Shortcuts */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Keyboard className="h-4 w-4" />
                          Keyboard Shortcuts
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                            <kbd className="px-3 py-1.5 bg-background border rounded font-mono text-sm font-semibold">Space</kbd>
                            <span className="text-sm text-muted-foreground">Flip card</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                            <kbd className="px-3 py-1.5 bg-background border rounded font-mono text-sm font-semibold">1-4</kbd>
                            <span className="text-sm text-muted-foreground">Rate recall</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 ml-1">
                          Ratings: 1=Bad, 2=Good, 3=Better, 4=Easy
                        </p>
                      </div>

                      {/* Advanced Features */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Advanced Features
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-start gap-2 p-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>LaTeX Math:</strong>
                              <code className="ml-1 text-xs bg-muted px-1 rounded">$...$</code> or
                              <code className="ml-1 text-xs bg-muted px-1 rounded">$$...$$</code>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Multi-deck</strong> organization</span>
                          </div>
                          <div className="flex items-start gap-2 p-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Image embedding</strong> support</span>
                          </div>
                          <div className="flex items-start gap-2 p-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Progress tracking</strong> & stats</span>
                          </div>
                          <div className="flex items-start gap-2 p-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Import/Export</strong> decks</span>
                          </div>
                          <div className="flex items-start gap-2 p-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Offline-first:</strong> all in browser</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Suspense fallback={<LoadingSpinner />}>
                <Settings
                  studyMode={studyMode}
                  onStudyModeChange={setStudyMode}
                  keyboardMode={keyboardMode}
                  onKeyboardModeChange={setKeyboardMode}
                />
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

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <div data-onboarding="deck-selector" className="w-full sm:w-auto">
                <DeckSelector
                  decks={filteredDecks}
                  currentDeckId={currentDeckId}
                  onSelectDeck={setCurrentDeckId}
                  onCreateDeck={createDeck}
                  onDeleteDeck={deleteDeck}
                />
              </div>

              <div className="w-full sm:w-auto">
                <ImportExport
                  currentDeckId={currentDeckId}
                  onDeckImported={handleDeckImported}
                />
              </div>
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
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto" data-onboarding="tabs">
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
                    studyMode={studyMode}
                    keyboardMode={keyboardMode}
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
              Made with ❤️ by{" "}
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
          <Onboarding />
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
