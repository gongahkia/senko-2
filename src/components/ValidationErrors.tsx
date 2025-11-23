import { AlertTriangle, AlertCircle } from "lucide-react";

interface ValidationErrorsProps {
  errors: string[];
  warnings?: string[];
}

export function ValidationErrors({ errors, warnings = [] }: ValidationErrorsProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive mb-1">Errors:</p>
              <ul className="text-xs text-destructive/90 space-y-1 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500 mb-1">Warnings:</p>
              <ul className="text-xs text-yellow-600/90 dark:text-yellow-500/90 space-y-1 list-disc list-inside">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
