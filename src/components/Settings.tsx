import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorSchemeSelector } from "@/components/colorscheme-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Settings() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Theme Settings */}
          <div className="space-y-2 sm:space-y-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-1">Color Scheme</h3>
            </div>
            <div className="space-y-2">
              <ColorSchemeSelector />
            </div>
          </div>

          <div className="border-t" />

          {/* Keyboard Shortcuts */}
          <div className="space-y-2 sm:space-y-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-1">Keyboard Shortcuts</h3>
            </div>
            <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm space-y-1">
              <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">Space</kbd> - Flip card</div>
              <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">1-4</kbd> - Rate recall (Bad to Easy)</div>
              <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">Ctrl+Z</kbd> / <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">⌘+Z</kbd> - Undo last rating</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Settings;
