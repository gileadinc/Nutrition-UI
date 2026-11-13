"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * The user's device location, used to rank and filter "near you" eat-out results
 * (`latitude` / `longitude` on `GET /api/eat-out/*`).
 *
 * Requested when the eat-out sections mount (`useAskForLocation`); the browser shows its own permission prompt.
 * Coordinates are saved on this device (localStorage) and sent as query params to the eat-out API, and to a
 * reverse-geocoding service to label the place (`usePlaceLabel`).
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

/** Asks for the device location once on mount (browser prompt) if we don't have it yet. */
export function useAskForLocation() {
  const { status } = useUserLocation();
  useEffect(() => {
    if (status === "idle") requestLocation();
  }, [status]);
}

const LABEL_KEY = "forkthis.location.label";
const labelCache = new Map<string, string>();

/**
 * Human-readable place for the saved coordinates, e.g. "Tysons, VA". Looked up once per ~1km cell
 * via a keyless reverse-geocoding service (the rounded coordinates are sent to it) and cached on
 * this device. Null until resolved, or if the lookup fails.
 */
export function usePlaceLabel(coords: Coords | null): string | null {
  const key = coords ? `${coords.latitude},${coords.longitude}` : null;
  const [fetched, setFetched] = useState<{ key: string; label: string } | null>(null);

  useEffect(() => {
    if (!coords || !key || labelCache.has(key)) return;
    try {
      const raw = window.localStorage.getItem(LABEL_KEY);
      const saved = raw ? (JSON.parse(raw) as { key?: string; label?: string }) : null;
      if (saved?.key === key && saved.label) {
        labelCache.set(key, saved.label);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from the persisted label once on mount
        setFetched({ key, label: saved.label });
        return;
      }
    } catch {
      // unreadable storage: look it up again
    }
    const ctrl = new AbortController();
    const url =
      "https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en" +
      `&latitude=${coords.latitude}&longitude=${coords.longitude}`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { locality?: string; city?: string; principalSubdivisionCode?: string }) => {
        const place = d.locality || d.city;
        if (!place) return;
        const region = d.principalSubdivisionCode?.split("-")[1];
        const label = region ? `${place}, ${region}` : place;
        labelCache.set(key, label);
        try {
          window.localStorage.setItem(LABEL_KEY, JSON.stringify({ key, label }));
        } catch {
          // not persisted; still used for this session
        }
        setFetched({ key, label });
      })
      .catch(() => {
        // keep the generic label
      });
    return () => ctrl.abort();
  }, [coords, key]);

  if (!key) return null;
  return labelCache.get(key) ?? (fetched?.key === key ? fetched.label : null);
}

/** Eat-out query params for the saved location, or `{}` when we don't have one. */
export const NEAR_RADIUS_MILES = 25;
export const nearParams = (coords: Coords | null) =>
  coords
    ? { latitude: coords.latitude, longitude: coords.longitude, radiusMiles: NEAR_RADIUS_MILES }
    : {};
