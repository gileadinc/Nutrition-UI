import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAsync } from "./useAsync";
import { ApiError } from "@/lib/api";

describe("useAsync", () => {
  it("starts idle and transitions through loading to success", async () => {
    const fn = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useAsync(fn));

    expect(result.current.status).toBe("idle");

    let returned: unknown;
    await act(async () => {
      returned = await result.current.execute();
    });

    expect(returned).toEqual({ id: 1 });
    expect(result.current.status).toBe("success");
    expect(result.current.data).toEqual({ id: 1 });
    expect(result.current.error).toBeNull();
  });

  it("sets a user-facing error message on failure", async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError("Invalid credentials", { kind: "api" }));
    const { result } = renderHook(() => useAsync(fn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("Invalid credentials");
    expect(result.current.data).toBeNull();
  });

  it("passes arguments through to the async function", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const { result } = renderHook(() => useAsync(fn));

    await act(async () => {
      await result.current.execute("a", 2);
    });

    expect(fn).toHaveBeenCalledWith("a", 2);
  });

  it("ignores a stale in-flight call when a newer call resolves first", async () => {
    let resolveFirst!: (value: string) => void;
    const first = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const fn = vi.fn().mockReturnValueOnce(first).mockResolvedValueOnce("second");

    const { result } = renderHook(() => useAsync(fn));

    let firstCallPromise!: Promise<string | undefined>;
    act(() => {
      firstCallPromise = result.current.execute();
    });

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe("second");

    await act(async () => {
      resolveFirst("first");
      await firstCallPromise;
    });

    expect(result.current.data).toBe("second");
  });

  it("resets state back to idle", async () => {
    const fn = vi.fn().mockResolvedValue("done");
    const { result } = renderHook(() => useAsync(fn));

    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.status).toBe("success");

    act(() => {
      result.current.reset();
    });

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.data).toBeNull();
  });
});
