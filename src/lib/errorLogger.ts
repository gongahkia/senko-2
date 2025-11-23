export function logError(error: Error, errorInfo: React.ErrorInfo | null) {
  console.error("Error caught by ErrorBoundary:", error);

  if (errorInfo) {
    console.error("Component stack:", errorInfo.componentStack);
  }

  // Store error in localStorage for debugging
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
    };

    const existingLogs = JSON.parse(localStorage.getItem("error-logs") || "[]");
    existingLogs.push(errorLog);

    // Keep only last 10 errors
    const recentLogs = existingLogs.slice(-10);
    localStorage.setItem("error-logs", JSON.stringify(recentLogs));
  } catch (e) {
    console.error("Failed to log error to localStorage:", e);
  }
}
