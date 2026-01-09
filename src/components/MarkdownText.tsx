import { MathJax } from "better-react-mathjax";
import { parseMarkdown } from "@/lib/utils";

interface MarkdownTextProps {
  children: string;
  className?: string;
}

/**
 * Component that renders text with both LaTeX (via MathJax) and markdown formatting
 * Supports:
 * - LaTeX math: $inline$ and $$display$$
 * - Bold: **text** or ***text***
 * - Italic: *text*
 * - Bold+Italic: ***text***
 * - Bulleted lists: - item or * item
 * - Numbered lists: 1. item, 2. item, etc.
 */
export function MarkdownText({ children, className = "" }: MarkdownTextProps) {
  const htmlContent = parseMarkdown(children);

  return (
    <MathJax key={children.substring(0, 50)} dynamic hideUntilTypeset="first">
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </MathJax>
  );
}
