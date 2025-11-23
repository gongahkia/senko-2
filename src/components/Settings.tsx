import { Settings as SettingsIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorSchemeSelector } from "@/components/colorscheme-selector";
import { StudyModeSelector } from "@/components/StudyModeSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudyMode } from "@/types";

type KeyboardMode = "default" | "vim" | "emacs";

interface SettingsProps {
  studyMode: StudyMode;
  onStudyModeChange: (mode: StudyMode) => void;
  keyboardMode: KeyboardMode;
  onKeyboardModeChange: (mode: KeyboardMode) => void;
}

export function Settings({ studyMode, onStudyModeChange, keyboardMode, onKeyboardModeChange }: SettingsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Settings</DialogTitle>
          <DialogDescription>
            Customize your learning experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold mb-1">Appearance</h3>
              <p className="text-sm text-muted-foreground">Customize the look and feel</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color-scheme">Color Scheme</Label>
              <ColorSchemeSelector />
              <p className="text-xs text-muted-foreground">
                Choose from 14 beautiful themes optimized for extended study sessions
              </p>
            </div>
          </div>

          <div className="border-t" />

          {/* Study Mode Settings */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold mb-1">Study Mode</h3>
              <p className="text-sm text-muted-foreground">Select your preferred study technique</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="study-mode">Active Mode</Label>
              <StudyModeSelector mode={studyMode} onModeChange={onStudyModeChange} />
              <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                <div><strong>Normal:</strong> Classic flashcard review</div>
                <div><strong>Pomodoro:</strong> 25min work, 5min break cycles</div>
                <div><strong>Sprint:</strong> Timed rapid-fire review</div>
                <div><strong>Zen:</strong> No stats, pure concentration</div>
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Keyboard Settings */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold mb-1">Keyboard Bindings</h3>
              <p className="text-sm text-muted-foreground">Choose your preferred keyboard navigation style</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyboard-mode">Keyboard Mode</Label>
              <Select value={keyboardMode} onValueChange={(value: KeyboardMode) => onKeyboardModeChange(value)}>
                <SelectTrigger id="keyboard-mode" className="w-full">
                  <SelectValue placeholder="Select keyboard mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (Space, 1-4)</SelectItem>
                  <SelectItem value="vim">Vim Mode (hjkl, etc.)</SelectItem>
                  <SelectItem value="emacs">Emacs Mode (C-n, C-p, etc.)</SelectItem>
                </SelectContent>
              </Select>

              {keyboardMode === "default" && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                  <div className="font-semibold mb-2">Default Shortcuts:</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">Space</kbd> - Flip card</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">1-4</kbd> - Rate recall</div>
                </div>
              )}

              {keyboardMode === "vim" && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                  <div className="font-semibold mb-2">Vim Shortcuts:</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">Space</kbd> or <kbd className="px-2 py-1 bg-background border rounded text-xs">Enter</kbd> - Flip card</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">1-4</kbd> - Rate recall (Bad to Easy)</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">j</kbd> - Next card (if applicable)</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">k</kbd> - Previous card (if applicable)</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">h</kbd> - Navigate to Recall tab</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">l</kbd> - Navigate to Questions tab</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">;</kbd> - Navigate to Statistics tab</div>
                </div>
              )}

              {keyboardMode === "emacs" && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                  <div className="font-semibold mb-2">Emacs Shortcuts:</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">Space</kbd> or <kbd className="px-2 py-1 bg-background border rounded text-xs">C-m</kbd> - Flip card</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">1-4</kbd> - Rate recall</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">C-n</kbd> - Next card (if applicable)</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">C-p</kbd> - Previous card (if applicable)</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">C-x r</kbd> - Navigate to Recall tab</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">C-x q</kbd> - Navigate to Questions tab</div>
                  <div><kbd className="px-2 py-1 bg-background border rounded text-xs">C-x s</kbd> - Navigate to Statistics tab</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
