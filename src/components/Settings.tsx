import { Settings as SettingsIcon } from "lucide-react";
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

          {/* Study Mode Settings */}
          <div className="space-y-2 sm:space-y-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-1">Study Mode</h3>
            </div>
            <div className="space-y-2">
              <StudyModeSelector mode={studyMode} onModeChange={onStudyModeChange} />

              {studyMode === "normal" && (
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm">
                  <div className="font-semibold mb-1 sm:mb-2">Normal Mode:</div>
                  <div>Classic flashcard review with active recall. Perfect for steady, comprehensive learning at your own pace.</div>
                </div>
              )}

              {studyMode === "pomodoro" && (
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm">
                  <div className="font-semibold mb-1 sm:mb-2">Pomodoro Mode:</div>
                  <div>Study in focused 25-minute work sessions followed by 5-minute breaks. Helps maintain concentration and prevents burnout.</div>
                </div>
              )}

              {studyMode === "sprint" && (
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm">
                  <div className="font-semibold mb-1 sm:mb-2">Sprint Mode:</div>
                  <div>Timed rapid-fire review sessions designed for quick, intensive practice. Great for last-minute review before exams.</div>
                </div>
              )}

              {studyMode === "zen" && (
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm">
                  <div className="font-semibold mb-1 sm:mb-2">Zen Mode:</div>
                  <div>Distraction-free studying with no statistics or counters visible. Focus purely on the material without performance pressure.</div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t" />

          {/* Keyboard Settings */}
          <div className="space-y-2 sm:space-y-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-1">Keyboard Bindings</h3>
            </div>
            <div className="space-y-2">
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
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm space-y-1">
                  <div className="font-semibold mb-1 sm:mb-2">Default Shortcuts:</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">Space</kbd> - Flip card</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">1-4</kbd> - Rate recall</div>
                </div>
              )}

              {keyboardMode === "vim" && (
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm space-y-1">
                  <div className="font-semibold mb-1 sm:mb-2">Vim Shortcuts:</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">Space</kbd> or <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">Enter</kbd> - Flip card</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">1-4</kbd> - Rate recall (Bad to Easy)</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">j</kbd> - Next card (if applicable)</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">k</kbd> - Previous card (if applicable)</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">h</kbd> - Navigate to Recall tab</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">l</kbd> - Navigate to Questions tab</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">;</kbd> - Navigate to Statistics tab</div>
                </div>
              )}

              {keyboardMode === "emacs" && (
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm space-y-1">
                  <div className="font-semibold mb-1 sm:mb-2">Emacs Shortcuts:</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">Space</kbd> or <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">C-m</kbd> - Flip card</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">1-4</kbd> - Rate recall</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">C-n</kbd> - Next card (if applicable)</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">C-p</kbd> - Previous card (if applicable)</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">C-x r</kbd> - Navigate to Recall tab</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">C-x q</kbd> - Navigate to Questions tab</div>
                  <div><kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background border rounded text-xs">C-x s</kbd> - Navigate to Statistics tab</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Settings;
