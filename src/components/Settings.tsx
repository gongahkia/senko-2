import { useState, useMemo } from "react";
import { Palette, Search, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTheme } from "@/components/theme-provider";
import { ColorScheme } from "@/types";

const colorSchemes: { value: ColorScheme; label: string; category: string }[] = [
  { value: "default-light", label: "Default Light", category: "Default" },
  { value: "default-dark", label: "Default Dark", category: "Default" },
  { value: "gruvbox-light", label: "Gruvbox Light", category: "Gruvbox" },
  { value: "gruvbox-dark", label: "Gruvbox Dark", category: "Gruvbox" },
  { value: "catppuccin-latte", label: "Catppuccin Latte", category: "Catppuccin" },
  { value: "catppuccin-frappe", label: "Catppuccin Frappé", category: "Catppuccin" },
  { value: "catppuccin-macchiato", label: "Catppuccin Macchiato", category: "Catppuccin" },
  { value: "catppuccin-mocha", label: "Catppuccin Mocha", category: "Catppuccin" },
  { value: "ayu-light", label: "Ayu Light", category: "Ayu" },
  { value: "ayu-dark", label: "Ayu Dark", category: "Ayu" },
  { value: "ayu-mirage", label: "Ayu Mirage", category: "Ayu" },
  { value: "nord", label: "Nord", category: "Nord" },
  { value: "tokyo-night", label: "Tokyo Night", category: "Tokyo" },
  { value: "dracula", label: "Dracula", category: "Dracula" },
  { value: "solarized-light", label: "Solarized Light", category: "Solarized" },
  { value: "solarized-dark", label: "Solarized Dark", category: "Solarized" },
  { value: "one-dark", label: "One Dark", category: "One" },
  { value: "one-light", label: "One Light", category: "One" },
  { value: "monokai", label: "Monokai", category: "Monokai" },
  { value: "everforest-light", label: "Everforest Light", category: "Everforest" },
  { value: "everforest-dark", label: "Everforest Dark", category: "Everforest" },
  { value: "rose-pine", label: "Rosé Pine", category: "Rosé Pine" },
  { value: "rose-pine-moon", label: "Rosé Pine Moon", category: "Rosé Pine" },
  { value: "kanagawa", label: "Kanagawa", category: "Kanagawa" },
  { value: "github-light", label: "GitHub Light", category: "GitHub" },
  { value: "github-dark", label: "GitHub Dark", category: "GitHub" },
  { value: "night-owl", label: "Night Owl", category: "Night Owl" },
  { value: "palenight", label: "Palenight", category: "Palenight" },
  { value: "synthwave-84", label: "Synthwave '84", category: "Synthwave" },
  { value: "horizon", label: "Horizon", category: "Horizon" },
  { value: "andromeda", label: "Andromeda", category: "Andromeda" },
  { value: "cobalt2", label: "Cobalt2", category: "Cobalt" },
  { value: "shades-of-purple", label: "Shades of Purple", category: "Purple" },
  { value: "oceanic-next", label: "Oceanic Next", category: "Oceanic" },
  { value: "material-dark", label: "Material Dark", category: "Material" },
  { value: "panda", label: "Panda", category: "Panda" },
  { value: "snazzy", label: "Snazzy", category: "Snazzy" },
  { value: "darcula", label: "Darcula", category: "JetBrains" },
  { value: "moonlight", label: "Moonlight", category: "Moonlight" },
  { value: "vitesse-dark", label: "Vitesse Dark", category: "Vitesse" },
  { value: "winter-is-coming", label: "Winter is Coming", category: "Winter" },
  { value: "vesper", label: "Vesper", category: "Vesper" },
  { value: "flexoki-light", label: "Flexoki Light", category: "Flexoki" },
  { value: "flexoki-dark", label: "Flexoki Dark", category: "Flexoki" },
  { value: "arc-dark", label: "Arc Dark", category: "Arc" },
  { value: "iceberg", label: "Iceberg", category: "Iceberg" },
  { value: "tomorrow-night", label: "Tomorrow Night", category: "Tomorrow" },
  { value: "monokai-pro", label: "Monokai Pro", category: "Monokai" },
  { value: "bluloco-dark", label: "Bluloco Dark", category: "Bluloco" },
  { value: "laserwave", label: "Laserwave", category: "Retro" },
  { value: "slack-dark", label: "Slack Dark", category: "Slack" },
  { value: "fairy-floss", label: "Fairy Floss", category: "Pastel" },
  { value: "aura-dark", label: "Aura Dark", category: "Aura" },
  { value: "catppuccin-rose", label: "Catppuccin Rosé", category: "Catppuccin" },
  { value: "atom-one-dark-pro", label: "Atom One Dark Pro", category: "Atom" },
  { value: "sublime-material", label: "Sublime Material", category: "Material" },
  { value: "twilight", label: "Twilight", category: "Classic" },
  { value: "zenburn", label: "Zenburn", category: "Classic" },
  { value: "afterglow", label: "Afterglow", category: "Warm" },
  { value: "spacegray", label: "Spacegray", category: "Minimal" },
  { value: "merbivore", label: "Merbivore", category: "Unique" },
  { value: "apprentice", label: "Apprentice", category: "Vim" },
  { value: "papercolor-light", label: "PaperColor Light", category: "Light" },
  { value: "base16-ocean", label: "Base16 Ocean", category: "Base16" },
  { value: "gruvbox-material", label: "Gruvbox Material", category: "Gruvbox" },
  { value: "poimandres", label: "Poimandres", category: "VS Code" },
  { value: "bearded-arc", label: "Bearded Arc", category: "Bearded" },
  { value: "noctis", label: "Noctis", category: "Noctis" },
  { value: "rainglow", label: "Rainglow", category: "Vivid" },
  { value: "embark", label: "Embark", category: "Space" },
  { value: "plastic", label: "Plastic", category: "Minimal" },
  { value: "min-dark", label: "Min Dark", category: "Minimal" },
  { value: "pear", label: "Pear", category: "Light" },
  { value: "serendipity", label: "Serendipity", category: "Soft" },
  { value: "seti", label: "Seti UI", category: "Seti" },
  { value: "material-palenight", label: "Material Palenight", category: "Material" },
  { value: "high-contrast", label: "High Contrast", category: "Accessibility" },
  { value: "quiet-light", label: "Quiet Light", category: "Light" },
  { value: "blueberry", label: "Blueberry", category: "Blue" },
  { value: "sunburst", label: "Sunburst", category: "Warm" },
  { value: "autumn", label: "Autumn", category: "Warm" },
  { value: "earthsong", label: "Earthsong", category: "Earth" },
  { value: "alabaster", label: "Alabaster", category: "Light" },
  { value: "cobalt", label: "Cobalt", category: "Blue" },
  { value: "brackets-light", label: "Brackets Light", category: "Light" },
  { value: "brackets-dark", label: "Brackets Dark", category: "Dark" },
  { value: "espresso", label: "Espresso", category: "Warm" },
  { value: "hopscotch", label: "Hopscotch", category: "Colorful" },
  { value: "ir-black", label: "IR Black", category: "Dark" },
  { value: "kimbie-dark", label: "Kimbie Dark", category: "Warm" },
  { value: "marrakesh", label: "Marrakesh", category: "Earth" },
  { value: "paraiso-dark", label: "Paraiso Dark", category: "Colorful" },
  { value: "railscasts", label: "Railscasts", category: "Classic" },
  { value: "summerfruit-dark", label: "Summerfruit Dark", category: "Vivid" },
  { value: "tomorrow-night-blue", label: "Tomorrow Night Blue", category: "Tomorrow" },
  { value: "tomorrow-night-bright", label: "Tomorrow Night Bright", category: "Tomorrow" },
  { value: "chalk", label: "Chalk", category: "Pastel" },
  { value: "flat", label: "Flat", category: "Modern" },
  { value: "isotope", label: "Isotope", category: "Vivid" },
];

export function Settings() {
  const { colorScheme, setColorScheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSchemes = useMemo(() => {
    if (!searchQuery.trim()) return colorSchemes;
    const query = searchQuery.toLowerCase();
    return colorSchemes.filter(
      (scheme) =>
        scheme.label.toLowerCase().includes(query) ||
        scheme.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Color Scheme</DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Theme Grid */}
        <div className="overflow-y-auto flex-1 -mx-1 px-1">
          <div className="grid grid-cols-2 gap-2">
            {filteredSchemes.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => setColorScheme(scheme.value)}
                className={`p-3 rounded-lg border text-left transition-all hover:border-primary/50 ${
                  colorScheme === scheme.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{scheme.label}</span>
                  {colorScheme === scheme.value && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
          {filteredSchemes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No themes found matching "{searchQuery}"
            </div>
          )}
        </div>

        {searchQuery && filteredSchemes.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing {filteredSchemes.length} of {colorSchemes.length} themes
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default Settings;
