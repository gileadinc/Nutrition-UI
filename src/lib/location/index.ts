"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The user's device location, used to rank and filter "near you" eat-out results
 * (`latitude` / `longitude` on `GET /api/eat-out/*`).
 *
 * Never requested automatically: the browser prompt only appears after the user taps "Use my location".
 * Coordinates stay on this device (localStorage) and are only sent as query params to the eat-out API.
 */

export interface Coords {
  latitude: number;
  longitude: number;
}

export type LocationStatus =
  "idle" | "locating" | "granted" | "denied" | "unavailable" | "unsupported";

interface State {
  coords: Coords | null;
  status: LocationStatus;
}

const KEY = "forkthis.location";
const IDLE: State = { coords: null, status: "idle" };

const load = (): State => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return IDLE;
    const c = JSON.parse(raw) as Partial<Coords>;
    if (typeof c.latitude === "number" && typeof c.longitude === "number") {
      return { coords: { latitude: c.latitude, longitude: c.longitude }, status: "granted" };
    }
  } catch {
    // unreadable or blocked storage: behave as if nothing was saved
  }
  return IDLE;
};

let state: State = IDLE;
let hydrated = false;
const listeners = new Set<() => void>();

const set = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};
const hydrate = () => {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = load();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => {
  hydrate();
  return state;
};

/** Round to ~1km so the query key (and cache) doesn't churn on tiny GPS drift, and we send less precision. */
const round = (n: number) => Math.round(n * 100) / 100;

export function requestLocation(): void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    set({ coords: null, status: "unsupported" });
    return;
  }
  set({ coords: state.coords, status: "locating" });
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = {
        latitude: round(pos.coords.latitude),
        longitude: round(pos.coords.longitude),
      };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(coords));
      } catch {
        // not persisted; still used for this session
      }
      set({ coords, status: "granted" });
    },
    (err) =>
      set({ coords: null, status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable" }),
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
  );
}

export function clearLocation(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  set(IDLE);
}

export function useUserLocation() {
  const s = useSyncExternalStore(subscribe, getSnapshot, () => IDLE);
  const request = useCallback(() => requestLocation(), []);
  const clear = useCallback(() => clearLocation(), []);
  return { coords: s.coords, status: s.status, request, clear };
}

/** Eat-out query params for the saved location, or `{}` when we don't have one. */
export const NEAR_RADIUS_MILES = 25;
export const nearParams = (coords: Coords | null) =>
  coords
    ? { latitude: coords.latitude, longitude: coords.longitude, radiusMiles: NEAR_RADIUS_MILES }
    : {};
