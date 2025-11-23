import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Toast as ToastType } from "@/hooks/useToast";

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const toastStyles = {
  success: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",
  error: "bg-destructive/10 border-destructive/30 text-destructive",
  warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-500",
  info: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
};

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Toast notification component
 * Displays temporary messages with different severity levels
 */
export function Toast({ toast, onClose }: ToastProps) {
  const Icon = toastIcons[toast.type];

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-top-5 ${toastStyles[toast.type]}`}
      role="alert"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

/**
 * Container for displaying multiple toast notifications
 * Positioned at top-right of viewport
 */
export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
