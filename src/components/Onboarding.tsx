import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    target: '[data-onboarding="deck-selector"]',
    title: "Create Your First Deck",
    description: "Start by creating a deck for any subject you want to study. Click the + button to get started.",
    position: "bottom",
  },
  {
    target: '[data-onboarding="tabs"]',
    title: "Navigate Between Sections",
    description: "Use these tabs to switch between Recall (study mode), Questions (add/edit cards), and Statistics (track progress).",
    position: "bottom",
  },
  {
    target: '[data-onboarding="study-mode"]',
    title: "Choose Your Study Mode",
    description: "Select different study modes like Normal, Pomodoro, Sprint, or Zen to customize your learning experience.",
    position: "bottom",
  },
  {
    target: '[data-onboarding="theme-selector"]',
    title: " Your Theme",
    description: "Pick from 14 beautiful color schemes to make studying more enjoyable. Your eyes will thank you!",
    position: "bottom",
  },
  {
    target: '[data-onboarding="help"]',
    title: "Need Help?",
    description: "Click here anytime to access the Quick Start Guide with detailed instructions and tips.",
    position: "left",
  },
];

const ONBOARDING_KEY = "senko-onboarding-completed";

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Delay showing onboarding to allow DOM to render
      setTimeout(() => {
        setIsVisible(true);
        updateHighlight();
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      updateHighlight();
    }
  }, [currentStep, isVisible]);

  const updateHighlight = () => {
    const step = ONBOARDING_STEPS[currentStep];
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);
    }
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible || !highlightRect) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const padding = 8;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    const tooltipOffset = 20;
    let top = 0;
    let left = 0;

    switch (step.position) {
      case "bottom":
        top = highlightRect.bottom + tooltipOffset;
        left = highlightRect.left + highlightRect.width / 2;
        return { top: `${top}px`, left: `${left}px`, transform: "translateX(-50%)" };
      case "top":
        top = highlightRect.top - tooltipOffset;
        left = highlightRect.left + highlightRect.width / 2;
        return { top: `${top}px`, left: `${left}px`, transform: "translate(-50%, -100%)" };
      case "left":
        top = highlightRect.top + highlightRect.height / 2;
        left = highlightRect.left - tooltipOffset;
        return { top: `${top}px`, left: `${left}px`, transform: "translate(-100%, -50%)" };
      case "right":
        top = highlightRect.top + highlightRect.height / 2;
        left = highlightRect.right + tooltipOffset;
        return { top: `${top}px`, left: `${left}px`, transform: "translateY(-50%)" };
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Translucent backdrop with cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={highlightRect.left - padding}
              y={highlightRect.top - padding}
              width={highlightRect.width + padding * 2}
              height={highlightRect.height + padding * 2}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
          onClick={completeOnboarding}
        />
      </svg>

      {/* Highlight border */}
      <div
        className="absolute border-4 border-primary rounded-lg pointer-events-none"
        style={{
          top: `${highlightRect.top - padding}px`,
          left: `${highlightRect.left - padding}px`,
          width: `${highlightRect.width + padding * 2}px`,
          height: `${highlightRect.height + padding * 2}px`,
          boxShadow: "0 0 0 4px rgba(var(--primary), 0.3), 0 0 20px rgba(var(--primary), 0.5)",
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute bg-card border border-border rounded-lg shadow-2xl p-6 max-w-sm pointer-events-auto"
        style={getTooltipStyle()}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </div>
            <h3 className="text-lg font-bold">{step.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-2"
            onClick={completeOnboarding}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Previous
          </Button>

          <div className="flex gap-1">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <Button size="sm" onClick={handleNext}>
            {currentStep === ONBOARDING_STEPS.length - 1 ? "Finish" : "Next"}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        <button
          className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
          onClick={completeOnboarding}
        >
          Skip tour
        </button>
      </div>
    </div>
  );
}
