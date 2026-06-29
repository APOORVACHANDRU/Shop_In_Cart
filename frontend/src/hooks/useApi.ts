/**
 * Custom hook for managing async API calls with loading, error, and success state.
 * Provides a consistent pattern for all data fetching across the app.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { extractErrorMessage } from "../services/api";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | undefined>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * Hook for one-off API mutations (create, update, delete).
 *
 * Usage:
 *   const { execute, loading, error } = useApi(productService.create);
 *   const result = await execute(payload);
 */
export function useApi<T>(
  apiFunc: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: "",
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const result = await apiFunc(...args);
        setState({ data: result, loading: false, error: "" });
        return result;
      } catch (err) {
        const message = extractErrorMessage(err);
        setState((prev) => ({ ...prev, loading: false, error: message }));
        return undefined;
      }
    },
    [apiFunc]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: "" });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return { ...state, execute, reset, setData };
}

/**
 * Hook that fetches data immediately on mount.
 *
 * Usage:
 *   const { data: products, loading, refetch } = useFetch(() => productService.list({ limit: 100 }));
 */
export function useFetch<T>(
  apiFunc: () => Promise<T>,
  deps: any[] = []
): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: "",
  });
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const result = await apiFunc();
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: "" });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({ data: null, loading: false, error: extractErrorMessage(err) });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  return { ...state, refetch: fetch };
}
