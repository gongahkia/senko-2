import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { ColorScheme } from "@/types";

const colorSchemes: { value: ColorScheme; label: string }[] = [
  { value: "default-light", label: "Default Light" },
  { value: "default-dark", label: "Default Dark" },
  { value: "gruvbox-light", label: "Gruvbox Light" },
  { value: "gruvbox-dark", label: "Gruvbox Dark" },
  { value: "catppuccin-latte", label: "Catppuccin Latte" },
  { value: "catppuccin-frappe", label: "Catppuccin Frappé" },
  { value: "catppuccin-macchiato", label: "Catppuccin Macchiato" },
  { value: "catppuccin-mocha", label: "Catppuccin Mocha" },
  { value: "ayu-light", label: "Ayu Light" },
  { value: "ayu-dark", label: "Ayu Dark" },
  { value: "ayu-mirage", label: "Ayu Mirage" },
  { value: "nord", label: "Nord" },
  { value: "tokyo-night", label: "Tokyo Night" },
  { value: "dracula", label: "Dracula" },
  { value: "solarized-light", label: "Solarized Light" },
  { value: "solarized-dark", label: "Solarized Dark" },
  { value: "one-dark", label: "One Dark" },
  { value: "one-light", label: "One Light" },
  { value: "monokai", label: "Monokai" },
  { value: "everforest-light", label: "Everforest Light" },
  { value: "everforest-dark", label: "Everforest Dark" },
  { value: "rose-pine", label: "Rosé Pine" },
  { value: "rose-pine-moon", label: "Rosé Pine Moon" },
  { value: "kanagawa", label: "Kanagawa" },
];

export function ColorSchemeSelector() {
  const { colorScheme, setColorScheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Select value={colorScheme} onValueChange={setColorScheme}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          {colorSchemes.map((scheme) => (
            <SelectItem key={scheme.value} value={scheme.value}>
              {scheme.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
