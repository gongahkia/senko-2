import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");

  const handleCreateDeck = () => {
    if (newDeckName.trim()) {
      onCreateDeck(newDeckName.trim(), newDeckDescription.trim() || undefined);
      setNewDeckName("");
      setNewDeckDescription("");
      setIsCreateDialogOpen(false);
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Deck</DialogTitle>
            <DialogDescription>
              Create a new flashcard deck to organize your questions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Deck Name</label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2"
                placeholder="e.g., Calculus I"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateDeck();
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2"
                placeholder="e.g., Limits, derivatives, integrals"
                value={newDeckDescription}
                onChange={(e) => setNewDeckDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateDeck}>Create Deck</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
