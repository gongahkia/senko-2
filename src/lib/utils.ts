import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate unique ID
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Format date for display
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

// Format date for storage (YYYY-MM-DD)
export function formatDateKey(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

// Calculate time difference in minutes
export function getMinutesDiff(start: number, end: number): number {
  return Math.floor((end - start) / 1000 / 60);
}

// Shuffle array (Fisher-Yates)
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Parse questions from text
export function parseQuestions(inputText: string): { question: string; answer: string }[] {
  if (!inputText.trim()) return [];

  // Pattern: question, followed by "===", followed by an answer
  const pattern = /([^\n]*)\n===\n([\s\S]*?)(?=\n[^\n]*\n===\n|$)/g;

  const questions: { question: string; answer: string }[] = [];
  let match;
  while ((match = pattern.exec(inputText)) !== null) {
    const question = match[1].trim();
    const answer = match[2].trim();
    if (question && answer) {
      questions.push({ question, answer });
    }
  }

  return questions;
}

// Convert image file to base64
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Validate image file
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  return validTypes.includes(file.type) && file.size <= maxSize;
}
