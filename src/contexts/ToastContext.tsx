import { createContext, useContext, ReactNode } from "react";
import { useToast, ToastType } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => string;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Provider for toast notifications
 * Wraps app to provide global toast functionality
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, showToast, hideToast } = useToast();

  const value: ToastContextValue = {
    showToast,
    showSuccess: (message: string, duration?: number) =>
      showToast(message, "success", duration),
    showError: (message: string, duration?: number) =>
      showToast(message, "error", duration),
    showWarning: (message: string, duration?: number) =>
      showToast(message, "warning", duration),
    showInfo: (message: string, duration?: number) =>
      showToast(message, "info", duration),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast functionality
 * Must be used within ToastProvider
 */
export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider");
  }
  return context;
}
