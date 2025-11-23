# senko-2

Advanced active recall flashcard application built for students who want to master their material through intelligent spaced repetition.

## Philosophy

- **Active Recall Over Passive Review**: Retrieve information from memory rather than re-reading
- **Self-Directed Mastery**: You control the content, pace, and study mode
- **Honest Self-Assessment**: Build metacognitive awareness through rating
- **Effortless Efficiency**: Keyboard-first interface for distraction-free studying
- **Tech-Augmented Cognition**: Use LLMs as study partners to generate questions

## Features

- 📚 **Multi-Deck System**: Organize by subject/topic with separate progress tracking
- 📊 **Statistics Dashboard**: Heatmaps, accuracy trends, session analytics
- ⏱️ **Study Session Modes**: Pomodoro, Sprint, and Zen modes
- 🎨 **Multiple Colorschemes**: Gruvbox, Catppuccin, Ayu, Nord, Tokyo Night, Dracula
- 🖼️ **Image Support**: Embed diagrams in questions/answers
- 🧮 **LaTeX Math**: Full MathJax support for STEM subjects
- 💾 **Offline-First**: Works completely offline with localStorage
- 📤 **Import/Export**: Share decks via JSON
- 🎯 **Smart Parsing**: Supports multiple flashcard formats

## Build

```bash
npm install
npm run dev
```

## Usage

Generate questions using your favorite LLM with this format:

```
What is the formula for the area of a circle?
===
The area of a circle is $A = \pi r^2$ where $r$ is the radius.

What is the quadratic formula?
===
$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
```

Keyboard shortcuts:
- `Space`: Reveal answer
- `1-4`: Rate your recall
- `Tab`: Switch between tabs

## License

MIT
