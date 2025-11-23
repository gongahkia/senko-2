import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const handleCreateDeck = () => {
    const name = prompt("Enter deck name:");
    if (name && name.trim()) {
      onCreateDeck(name.trim());
    }
  };

  return (
    <div className="flex items-center gap-2">
      <FolderOpen className="h-5 w-5 text-muted-foreground" />

      <Select value={currentDeckId || undefined} onValueChange={onSelectDeck}>
        <SelectTrigger className="w-[200px]">
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

      <Button variant="outline" size="icon" onClick={handleCreateDeck}>
        <Plus className="h-4 w-4" />
      </Button>

      {currentDeckId && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm("Are you sure you want to delete this deck?")) {
              onDeleteDeck(currentDeckId);
            }
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}
