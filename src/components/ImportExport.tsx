import { useState, useEffect, useRef } from "react";
import { useToastContext } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Upload, FileJson, FileText } from "lucide-react";
import { exportDeck, importDeck as importJSONDeck, exportAllData } from "@/services/storage";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { isValidJSON, validateDeckStructure } from "@/lib/validation";
import { ValidationErrors } from "@/components/ValidationErrors";
import { importDeck as importFromFile, ImportFormat, getFormatName } from "@/services/importers";

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
  const [importMode, setImportMode] = useState<'json' | 'file'>('file');
  const [importFormat, setImportFormat] = useState<ImportFormat>('auto');
  const [deckName, setDeckName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      } catch {
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);

      // Auto-fill deck name from filename if not set
      if (!deckName) {
        const name = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setDeckName(name);
      }
    };
    reader.readAsText(file);
  };

  const handleImportDeck = () => {
    if (importMode === 'json') {
      // Handle JSON import (existing logic)
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

        const deck = importJSONDeck(importData);
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
    } else {
      // Handle file import (new logic)
      if (!fileContent.trim()) {
        setValidationErrors(["Please select a file to import"]);
        setValidationWarnings([]);
        return;
      }

      if (!deckName.trim()) {
        setValidationErrors(["Please provide a name for the deck"]);
        setValidationWarnings([]);
        return;
      }

      setIsImporting(true);
      setTimeout(() => {
        const result = importFromFile(fileContent, deckName, importFormat);

        if (result.success && result.deck) {
          // Save the imported deck using existing storage
          const deck = result.deck;
          const existingData = localStorage.getItem('senko-2-data');
          const appData = existingData ? JSON.parse(existingData) : { decks: [], sessions: [] };
          appData.decks.push(deck);
          localStorage.setItem('senko-2-data', JSON.stringify(appData));

          const formatName = result.detectedFormat ? getFormatName(result.detectedFormat as ImportFormat) : 'unknown';
          showSuccess(`Successfully imported ${result.deck.questions.length} cards from ${formatName} format!`);

          if (result.warnings && result.warnings.length > 0) {
            setValidationWarnings(result.warnings);
          } else {
            setValidationWarnings([]);
          }

          setValidationErrors([]);
          setFileContent("");
          setDeckName("");
          setIsImportOpen(false);
          onDeckImported();

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          setValidationErrors([result.error || "Failed to import file"]);
          setValidationWarnings([]);
        }
        setIsImporting(false);
      }, 100);
    }
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
              Import from various formats or paste JSON data
            </DialogDescription>
          </DialogHeader>

          {/* Import Mode Toggle */}
          <div className="flex gap-2 border-b pb-3">
            <Button
              variant={importMode === 'file' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportMode('file')}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Import File
            </Button>
            <Button
              variant={importMode === 'json' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImportMode('json')}
              className="flex-1"
            >
              <FileJson className="h-4 w-4 mr-2" />
              JSON Data
            </Button>
          </div>

          {/* File Import Mode */}
          {importMode === 'file' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="format-select">Format</Label>
                <Select value={importFormat} onValueChange={(value: ImportFormat) => setImportFormat(value)}>
                  <SelectTrigger id="format-select">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="quizlet">Quizlet (TSV)</SelectItem>
                    <SelectItem value="obsidian">Obsidian Markdown</SelectItem>
                    <SelectItem value="text">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {importFormat === 'auto' && "Automatically detect the file format"}
                  {importFormat === 'csv' && "CSV format: Question, Answer, [Type]"}
                  {importFormat === 'quizlet' && "Quizlet TSV: Term→Definition→[ImageURL]"}
                  {importFormat === 'obsidian' && "Obsidian: Q:/A:, Question:/Answer:, or ## headings"}
                  {importFormat === 'text' && "Plain text with separators (-, :, |) or double newlines"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deck-name">Deck Name</Label>
                <Input
                  id="deck-name"
                  placeholder="My Imported Deck"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.txt,.md,.tsv"
                  className="cursor-pointer"
                />
              </div>

              {fileContent && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <Textarea
                    readOnly
                    value={fileContent.slice(0, 500) + (fileContent.length > 500 ? '...' : '')}
                    className="min-h-[150px] font-mono text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* JSON Import Mode */}
          {importMode === 'json' && (
            <Textarea
              placeholder='{"id": "deck-...", "name": "...", ...}'
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="min-h-[200px] sm:min-h-[300px] font-mono text-xs"
            />
          )}

          <ValidationErrors errors={validationErrors} warnings={validationWarnings} />

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsImportOpen(false);
                setValidationErrors([]);
                setValidationWarnings([]);
              }}
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

      <Button variant="outline" size="icon" onClick={handleExportDeck} title="Export Current Deck">
        <Download className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="icon" onClick={handleExportAll} title="Export All Decks">
        <FileJson className="h-4 w-4" />
      </Button>

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
