import { useState } from "react";
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

interface ImportExportProps {
  currentDeckId: string | null;
  onDeckImported: () => void;
}

export function ImportExport({
  currentDeckId,
  onDeckImported,
}: ImportExportProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [exportedData, setExportedData] = useState("");
  const [importData, setImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleExportDeck = () => {
    if (!currentDeckId) {
      alert("Please select a deck to export");
      return;
    }

    const data = exportDeck(currentDeckId);
    if (data) {
      setExportedData(data);
      setIsExportOpen(true);
    }
  };

  const handleExportAll = () => {
    const data = exportAllData();
    setExportedData(data);
    setIsExportOpen(true);
  };

  const handleImportDeck = () => {
    if (!importData.trim()) {
      alert("Please paste deck data to import");
      return;
    }

    setIsImporting(true);
    // Wrap in setTimeout to allow UI to update
    setTimeout(() => {
      const deck = importDeck(importData);
      if (deck) {
        alert(`Successfully imported deck: ${deck.name}`);
        setImportData("");
        setIsImportOpen(false);
        onDeckImported();
      } else {
        alert("Failed to import deck. Please check the JSON format.");
      }
      setIsImporting(false);
    }, 100);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportedData);
    alert("Copied to clipboard!");
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
      <Button variant="outline" onClick={handleExportDeck}>
        <Download className="h-4 w-4 mr-2" />
        Export Deck
      </Button>

      <Button variant="outline" onClick={handleExportAll}>
        <FileJson className="h-4 w-4 mr-2" />
        Export All
      </Button>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Deck
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Deck</DialogTitle>
            <DialogDescription>
              Paste the exported deck JSON data below
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder='{"id": "deck-...", "name": "...", ...}'
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            className="min-h-[300px] font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportDeck}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>
              Copy this data or download as a file to share or backup
            </DialogDescription>
          </DialogHeader>
          <Textarea
            readOnly
            value={exportedData}
            className="min-h-[300px] font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="outline" onClick={handleCopyToClipboard}>
              Copy to Clipboard
            </Button>
            <Button onClick={handleDownload}>Download JSON</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
