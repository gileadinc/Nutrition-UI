"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/api";

export interface ApiResource<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  /** Re-run the fetcher. */
  refetch: () => void;
}

interface State<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Runs an async fetcher on mount and whenever `deps` change. Ignores stale
 * responses if deps change mid-flight. Pass `enabled: false` to defer.
 *
 * `fetcher` is intentionally not a dependency — pass an inline closure and list
 * the values it closes over in `deps`.
 */
export function useApiResource<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options: { enabled?: boolean } = {},
): ApiResource<T> {
  const { enabled = true } = options;
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    isLoading: enabled,
  });

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the initial loading flag when a deferred fetch stays disabled
      setState((s) => (s.isLoading ? { ...s, isLoading: false } : s));
      return;
    }

    let active = true;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    fetcher()
      .then((result) => {
        if (active) setState({ data: result, error: null, isLoading: false });
      })
      .catch((err) => {
        if (active) {
          setState((s) => ({ ...s, error: getErrorMessage(err), isLoading: false }));
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nonce, ...deps]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, refetch };
}
