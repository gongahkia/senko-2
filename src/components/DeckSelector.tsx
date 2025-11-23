import { useState } from "react";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import { Deck } from "@/types";

interface DeckSelectorProps {
  decks: Deck[];
  currentDeckId: string | null;
  onSelectDeck: (deckId: string) => void;
  onCreateDeck: (name: string, description?: string) => void;
  onDeleteDeck: (deckId: string) => void;
}

export function DeckSelector({
  decks,
  currentDeckId,
  onSelectDeck,
  onCreateDeck,
  onDeleteDeck,
}: DeckSelectorProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);

  const handleCreateDeck = (name: string) => {
    onCreateDeck(name);
  };

  const handleDeleteDeck = () => {
    if (currentDeckId) {
      onDeleteDeck(currentDeckId);
    }
  };

  return (
    <>
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <FolderOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />

      <Select value={currentDeckId || undefined} onValueChange={onSelectDeck}>
        <SelectTrigger className="w-full sm:w-[200px] min-w-0">
          <SelectValue placeholder="Select a deck" />
        </SelectTrigger>
        <SelectContent>
          {decks.map((deck) => (
            <SelectItem key={deck.id} value={deck.id}>
              {deck.name} ({deck.questions.length})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={() => setShowCreatePrompt(true)} className="flex-shrink-0">
        <Plus className="h-4 w-4" />
      </Button>

      {currentDeckId && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-shrink-0"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>

    <PromptDialog
      open={showCreatePrompt}
      onOpenChange={setShowCreatePrompt}
      title="Create New Deck"
      description="Enter a name for your new deck"
      label="Deck Name"
      placeholder="e.g., Math Formulas"
      onConfirm={handleCreateDeck}
      confirmText="Create"
      cancelText="Cancel"
    />

    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title="Delete Deck"
      description="Are you sure you want to delete this deck? This action cannot be undone."
      onConfirm={handleDeleteDeck}
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
    />
    </>
  );
}
