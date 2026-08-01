"use client";

import { useCallback, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/api";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface UseAsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

export interface UseAsyncResult<T, Args extends unknown[]> extends UseAsyncState<T> {
  isLoading: boolean;
  execute: (...args: Args) => Promise<T | undefined>;
  reset: () => void;
}

export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
): UseAsyncResult<T, Args> {
  const [state, setState] = useState<UseAsyncState<T>>({
    status: "idle",
    data: null,
    error: null,
  });

  const callId = useRef(0);

  const execute = useCallback(
    async (...args: Args) => {
      const currentCall = ++callId.current;
      setState({ status: "loading", data: null, error: null });

      try {
        const data = await asyncFn(...args);
        if (currentCall === callId.current) {
          setState({ status: "success", data, error: null });
        }
        return data;
      } catch (error) {
        if (currentCall === callId.current) {
          setState({ status: "error", data: null, error: getErrorMessage(error) });
        }
        return undefined;
      }
    },
    [asyncFn],
  );

  const reset = useCallback(() => {
    callId.current += 1;
    setState({ status: "idle", data: null, error: null });
  }, []);

  return { ...state, isLoading: state.status === "loading", execute, reset };
}
