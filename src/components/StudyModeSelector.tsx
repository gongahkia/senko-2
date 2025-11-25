import { Brain, Timer, Zap, Pause } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudyMode } from "@/types";

interface StudyModeSelectorProps {
  mode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
}

const studyModes = [
  {
    value: "normal" as StudyMode,
    label: "Normal",
    description: "Classic flashcard review",
    icon: Brain,
  },
  {
    value: "pomodoro" as StudyMode,
    label: "Pomodoro",
    description: "25min work, 5min break",
    icon: Timer,
  },
  {
    value: "sprint" as StudyMode,
    label: "Sprint",
    description: "Timed rapid review",
    icon: Zap,
  },
  {
    value: "zen" as StudyMode,
    label: "Zen",
    description: "No stats, pure focus",
    icon: Pause,
  },
];

export function StudyModeSelector({ mode, onModeChange }: StudyModeSelectorProps) {
  const currentMode = studyModes.find((m) => m.value === mode);

  return (
    <div className="flex items-center gap-2">
      <Select value={mode} onValueChange={onModeChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Study mode" />
        </SelectTrigger>
        <SelectContent>
          {studyModes.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              <div className="flex items-center gap-2">
                <m.icon className="h-3 w-3" />
                <span>{m.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
