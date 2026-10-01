"use client";

/**
 * Melo's UI state (panel open/closed + the current chat). Module-level, so the FAB and the panel
 * share it and the conversation survives route changes. In memory only; a reload starts fresh.
 */

import { useSyncExternalStore } from "react";
import { answer, type MeloContext, type MeloLink, type MeloRule } from "./engine";

export interface MeloTurn {
  id: number;
  role: "user" | "assistant";
  text: string;
  at: number;
  rule?: MeloRule;
  links?: MeloLink[];
}

interface State {
  open: boolean;
  turns: MeloTurn[];
  isTyping: boolean;
}

let state: State = { open: false, turns: [], isTyping: false };
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const serverState: State = { open: false, turns: [], isTyping: false };

export function useMelo<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(serverState),
  );
}

export const meloActions = {
  open: () => set({ open: true }),
  close: () => set({ open: false }),
  toggle: () => set({ open: !state.open }),
  newChat() {
    if (timer) clearTimeout(timer);
    timer = null;
    set({ turns: [], isTyping: false });
  },
  /** Ask Melo. `ctx` is read at send time; the reply is computed from it after a short "thinking" beat. */
  send(text: string, ctx: MeloContext) {
    const q = text.trim();
    if (!q || state.isTyping) return;
    set({ turns: [...state.turns, { id: nextId++, role: "user", text: q, at: Date.now() }], isTyping: true });
    timer = setTimeout(() => {
      timer = null;
      const reply = answer(q, ctx);
      set({
        turns: [
          ...state.turns,
          { id: nextId++, role: "assistant", text: reply.text, at: Date.now(), rule: reply.rule, links: reply.links },
        ],
        isTyping: false,
      });
    }, 450);
  },
};
