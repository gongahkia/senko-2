import { useState, useEffect } from "react";
import { useToastContext } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Upload, FileJson } from "lucide-react";
import { exportDeck, importDeck, exportAllData } from "@/services/storage";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { isValidJSON, validateDeckStructure } from "@/lib/validation";
import { ValidationErrors } from "@/components/ValidationErrors";

interface ImportExportProps {
  currentDeckId: string | null;
  onDeckImported: () => void;
}

export function ImportExport({
  currentDeckId,
  onDeckImported,
}: ImportExportProps) {
  const { showSuccess, showError, showInfo } = useToastContext();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [exportedData, setExportedData] = useState("");
  const [importData, setImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Real-time validation feedback as user types
  useEffect(() => {
    if (!importData.trim()) {
      setValidationErrors([]);
      setValidationWarnings([]);
      return;
    }

    // Debounce validation to avoid excessive checks
    const timer = setTimeout(() => {
      // Validate JSON first
      const jsonValidation = isValidJSON(importData);
      if (!jsonValidation.valid) {
        setValidationErrors(jsonValidation.errors);
        setValidationWarnings([]);
        return;
      }

      // Parse and validate deck structure
      try {
        const data = JSON.parse(importData);
        const deckValidation = validateDeckStructure(data);
        setValidationErrors(deckValidation.errors);
        setValidationWarnings(deckValidation.warnings);
      } catch (e) {
        setValidationErrors(["Failed to parse JSON"]);
        setValidationWarnings([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [importData]);

  const [exportType, setExportType] = useState<"deck" | "all">("deck");

  const handleExportDeck = () => {
    if (!currentDeckId) {
      showError("Please select a deck to export");
      return;
    }

    const data = exportDeck(currentDeckId);
    if (data) {
      setExportedData(data);
      setExportType("deck");
      setIsExportOpen(true);
    }
  };

  const handleExportAll = () => {
    const data = exportAllData();
    setExportedData(data);
    setExportType("all");
    setIsExportOpen(true);
  };

  const handleImportDeck = () => {
    if (!importData.trim()) {
      setValidationErrors(["Please paste deck data to import"]);
      setValidationWarnings([]);
      return;
    }

    // Validate JSON first
    const jsonValidation = isValidJSON(importData);
    if (!jsonValidation.valid) {
      setValidationErrors(jsonValidation.errors);
      setValidationWarnings([]);
      return;
    }

    setIsImporting(true);
    // Wrap in setTimeout to allow UI to update
    setTimeout(() => {
      // Parse and validate deck structure
      const data = JSON.parse(importData);
      const deckValidation = validateDeckStructure(data);

      if (!deckValidation.valid) {
        setValidationErrors(deckValidation.errors);
        setValidationWarnings(deckValidation.warnings);
        setIsImporting(false);
        return;
      }

      // Show warnings if any
      setValidationWarnings(deckValidation.warnings);

      const deck = importDeck(importData);
      if (deck) {
        showSuccess(`Successfully imported deck: ${deck.name}`);
        setImportData("");
        setValidationErrors([]);
        setValidationWarnings([]);
        setIsImportOpen(false);
        onDeckImported();
      } else {
        setValidationErrors(["Failed to import deck. Please check the JSON format."]);
        setValidationWarnings([]);
      }
      setIsImporting(false);
    }, 100);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportedData);
    showInfo("Copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([exportedData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `senko-2-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={handleExportDeck} title="Export Current Deck">
        <Download className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="icon" onClick={handleExportAll} title="Export All Decks">
        <FileJson className="h-4 w-4" />
      </Button>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="Import Deck">
            <Upload className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-full sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Import Deck</DialogTitle>
            <DialogDescription className="text-sm">
              Paste the exported deck JSON data below
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder='{"id": "deck-...", "name": "...", ...}'
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            className="min-h-[200px] sm:min-h-[300px] font-mono text-xs"
          />
          <ValidationErrors errors={validationErrors} warnings={validationWarnings} />
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(false)}
              disabled={isImporting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleImportDeck} disabled={isImporting} className="w-full sm:w-auto">
              {isImporting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Importing...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-full sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{exportType === "deck" ? "Export Deck" : "Export All Decks"}</DialogTitle>
            <DialogDescription className="text-sm">
              {exportType === "deck"
                ? "Copy this deck data or download as a file to share or backup"
                : "Copy all your decks or download as a file to backup your entire collection"}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            readOnly
            value={exportedData}
            className="min-h-[200px] sm:min-h-[300px] font-mono text-xs"
          />
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard} className="w-full sm:w-auto">
              Copy to Clipboard
            </Button>
            <Button onClick={handleDownload} className="w-full sm:w-auto">Download JSON</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
