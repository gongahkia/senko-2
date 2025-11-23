import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeProvider } from "@/components/theme-provider";
import { ColorSchemeSelector } from "@/components/colorscheme-selector";
import { DeckSelector } from "@/components/DeckSelector";
import { Questions } from "@/components/Questions";
import { Recall } from "@/components/Recall";
import { Statistics } from "@/components/Statistics";
import { ImportExport } from "@/components/ImportExport";
import { StudyModeSelector } from "@/components/StudyModeSelector";
import { MathJaxContext } from "better-react-mathjax";
import { useDecks } from "@/hooks/useDecks";
import { StudyMode, QuestionItem } from "@/types";
import { BookOpen, HelpCircle, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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
    <MathJaxContext config={mathJaxConfig}>
      <ThemeProvider>
        <div className="container mx-auto max-w-[85%] pt-[3%] pb-[5%]">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">senko-2</h1>
              </div>
              <ColorSchemeSelector />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <DeckSelector
                decks={decks}
                currentDeckId={currentDeckId}
                onSelectDeck={setCurrentDeckId}
                onCreateDeck={createDeck}
                onDeleteDeck={deleteDeck}
              />

              <ImportExport
                currentDeckId={currentDeckId}
                onDeckImported={handleDeckImported}
              />

              <StudyModeSelector mode={studyMode} onModeChange={setStudyMode} />

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>How to Use senko-2</DialogTitle>
                    <DialogDescription>
                      Master your material through active recall
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Creating Questions</h4>
                      <p className="text-muted-foreground mb-2">
                        Generate questions with your favorite LLM or write them
                        manually. Use this format:
                      </p>
                      <div className="bg-muted p-3 rounded font-mono text-xs">
                        What is the formula for the area of a circle?
                        <br />
                        ===
                        <br />
                        The area is $A = \pi r^2$ where $r$ is the radius.
                        <br />
                        <br />
                        What is the quadratic formula?
                        <br />
                        ===
                        <br />
                        {"$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">LLM Prompt Template</h4>
                      <p className="text-muted-foreground mb-2">
                        Copy this prompt and paste it into ChatGPT, Claude, or any
                        LLM. Replace [YOUR TOPIC HERE] with your subject:
                      </p>
                      <div className="relative">
                        <div className="bg-muted p-3 rounded font-mono text-xs max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                          {promptTemplate}
                        </div>
                        <Button
                          onClick={copyPromptToClipboard}
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2"
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

                    <div>
                      <h4 className="font-semibold mb-2">Study Modes</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>
                          <strong>Normal:</strong> Classic flashcard review
                        </li>
                        <li>
                          <strong>Pomodoro:</strong> 25min work, 5min break
                          cycles
                        </li>
                        <li>
                          <strong>Sprint:</strong> Timed rapid-fire review
                        </li>
                        <li>
                          <strong>Zen:</strong> No stats, pure concentration
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">
                            Space
                          </kbd>{" "}
                          - Reveal answer
                        </li>
                        <li>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">
                            1-4
                          </kbd>{" "}
                          - Rate your recall (1=Bad, 4=Easy)
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Features</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Multi-deck organization</li>
                        <li>• LaTeX math support ($...$ for inline, $$...$$ for block)</li>
                        <li>• Image/diagram embedding</li>
                        <li>• Statistics and progress tracking</li>
                        <li>• Import/export decks</li>
                        <li>• Offline-first (all data in browser)</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
              <Button
                onClick={() => {
                  const name = prompt("Enter deck name:");
                  if (name) createDeck(name);
                }}
              >
                Create Your First Deck
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="recall" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="recall">Recall</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>

              <TabsContent value="recall" className="mt-6">
                <Recall
                  key={`${currentDeckId}-${refreshKey}`}
                  deckId={currentDeck.id}
                  questions={currentDeck.questions}
                  studyMode={studyMode}
                />
              </TabsContent>

              <TabsContent value="questions" className="mt-6">
                <Questions
                  deckId={currentDeck.id}
                  initialQuestions={currentDeck.questions}
                  onSave={handleSaveQuestions}
                />
              </TabsContent>

              <TabsContent value="stats" className="mt-6">
                <Statistics />
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
      </ThemeProvider>
    </MathJaxContext>
  );
}

export default App;
