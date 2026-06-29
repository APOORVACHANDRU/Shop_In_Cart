/**
 * Custom hook for managing success/error notifications with auto-dismiss.
 */

import { useState, useCallback, useEffect } from "react";

interface Notification {
  message: string;
  type: "success" | "error";
}

export function useNotification(autoDismissMs = 5000) {
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [notification, autoDismissMs]);

  const success = useCallback((message: string) => {
    setNotification({ message, type: "success" });
  }, []);

  const error = useCallback((message: string) => {
    setNotification({ message, type: "error" });
  }, []);

  const clear = useCallback(() => {
    setNotification(null);
  }, []);

  return { notification, success, error, clear };
}
