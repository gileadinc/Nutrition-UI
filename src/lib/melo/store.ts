"use client";

/**
 * Melo's UI + chat state. Module-level so the FAB, popup and full page share one conversation.
 * Conversations are kept on this device (localStorage `forkthis.melo.chats`, newest first, capped);
 * the voice-replies preference is `forkthis_melo_voice_replies`. No server involved.
 */

import { useSyncExternalStore } from "react";
import { answer, type MeloContext, type MeloLink, type MeloRule } from "./engine";
import { speak, spokenText, stopSpeaking } from "./voice";

export interface MeloTurn {
  id: number;
  role: "user" | "assistant";
  text: string;
  at: number;
  rule?: MeloRule;
  links?: MeloLink[];
  viaVoice?: boolean;
}

export interface MeloChat {
  id: string;
  title: string;
  turns: MeloTurn[];
  updatedAt: number;
}

interface State {
  open: boolean;
  turns: MeloTurn[];
  isTyping: boolean;
  activeId: string;
  history: MeloChat[];
  voiceReplies: boolean;
  feedback: Record<number, "up" | "down">;
}

const CHATS_KEY = "forkthis.melo.chats";
const VOICE_KEY = "forkthis_melo_voice_replies";
const MAX_CHATS = 30;

let chatSeq = 0;
const newChatId = () => `chat:${Date.now()}:${++chatSeq}`;

let state: State = {
  open: false,
  turns: [],
  isTyping: false,
  activeId: "chat:initial",
  history: [],
  voiceReplies: true,
  feedback: {},
};
const serverState: State = state;
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function setHistory(history: MeloChat[], extra: Partial<State> = {}) {
  const capped = history.slice(0, MAX_CHATS);
  try {
    window.localStorage.setItem(CHATS_KEY, JSON.stringify(capped));
  } catch {}
  set({ history: capped, ...extra });
}

/** Insert / refresh a chat at the top. */
function upsert(history: MeloChat[], id: string, turns: MeloTurn[]): MeloChat[] {
  if (turns.length === 0) return history;
  const prev = history.find((c) => c.id === id);
  const chat: MeloChat = {
    id,
    title: prev?.title ?? turns.find((t) => t.role === "user")?.text ?? "Conversation",
    turns,
    updatedAt: Date.now(),
  };
  return [chat, ...history.filter((c) => c.id !== id)];
}

const maxTurnId = (turns: MeloTurn[]) => turns.reduce((m, t) => Math.max(m, t.id), 0);

function readChats(): MeloChat[] {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(CHATS_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (c): c is MeloChat =>
          !!c &&
          typeof c.id === "string" &&
          typeof c.title === "string" &&
          Array.isArray(c.turns) &&
          typeof c.updatedAt === "number",
      )
      .slice(0, MAX_CHATS);
  } catch {
    return [];
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export function useMelo<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(serverState),
  );
}

export const meloActions = {
  /** Load saved chats and the voice preference (call once on the client). */
  hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    let voiceReplies = true;
    try {
      voiceReplies = window.localStorage.getItem(VOICE_KEY) !== "off";
    } catch {}
    const saved = readChats();
    const history = state.turns.length ? upsert(saved, state.activeId, state.turns) : saved;
    nextId = Math.max(nextId, ...history.map((c) => maxTurnId(c.turns) + 1));
    set({
      history,
      voiceReplies,
      activeId: state.activeId === "chat:initial" ? newChatId() : state.activeId,
    });
  },
  open: () => set({ open: true }),
  close: () => set({ open: false }),
  toggle: () => set({ open: !state.open }),
  newChat() {
    if (timer) clearTimeout(timer);
    timer = null;
    stopSpeaking();
    set({ turns: [], isTyping: false, activeId: newChatId(), feedback: {} });
  },
  /** Ask Melo. `ctx` is read at send time; the reply is computed after a short "thinking" beat. */
  send(text: string, ctx: MeloContext, opts: { viaVoice?: boolean; immediate?: boolean } = {}) {
    const q = text.trim();
    if (!q || state.isTyping) return;
    stopSpeaking();
    const userTurn: MeloTurn = {
      id: nextId++,
      role: "user",
      text: q,
      at: Date.now(),
      ...(opts.viaVoice ? { viaVoice: true } : {}),
    };
    const reply = () => {
      const r = answer(q, ctx);
      const turn: MeloTurn = {
        id: nextId++,
        role: "assistant",
        text: r.text,
        at: Date.now(),
        rule: r.rule,
        links: r.links,
      };
      // Only voice questions are answered aloud; typed questions never are.
      if (opts.viaVoice && state.voiceReplies) {
        speak(
          `melo-answer:${turn.id}`,
          spokenText(turn.text, (turn.links ?? []).flatMap((l) => (l.card ? [l.card] : []))),
        );
      }
      return turn;
    };
    if (opts.immediate) {
      const turns = [...state.turns, userTurn, reply()];
      setHistory(upsert(state.history, state.activeId, turns), { turns });
      return;
    }
    set({ turns: [...state.turns, userTurn], isTyping: true });
    timer = setTimeout(() => {
      timer = null;
      const turns = [...state.turns, reply()];
      setHistory(upsert(state.history, state.activeId, turns), { turns, isTyping: false });
    }, 600);
  },
  reopen(id: string) {
    const chat = state.history.find((c) => c.id === id);
    if (!chat) return;
    if (timer) clearTimeout(timer);
    timer = null;
    stopSpeaking();
    nextId = Math.max(nextId, maxTurnId(chat.turns) + 1);
    set({ activeId: chat.id, turns: chat.turns, isTyping: false, feedback: {} });
  },
  remove(id: string) {
    const index = state.history.findIndex((c) => c.id === id);
    if (index < 0) return null;
    const chat = state.history[index];
    const wasActive = state.activeId === id;
    if (wasActive) {
      if (timer) clearTimeout(timer);
      timer = null;
      stopSpeaking();
    }
    const history = state.history.filter((c) => c.id !== id);
    setHistory(history, wasActive ? { activeId: newChatId(), turns: [], isTyping: false, feedback: {} } : {});
    return { chat, index, wasActive };
  },
  restore(rec: { chat: MeloChat; index: number; wasActive: boolean }) {
    if (state.history.some((c) => c.id === rec.chat.id)) return;
    const history = [...state.history];
    history.splice(Math.min(rec.index, history.length), 0, rec.chat);
    setHistory(
      history,
      rec.wasActive && state.turns.length === 0 && !state.isTyping
        ? { activeId: rec.chat.id, turns: rec.chat.turns, feedback: {} }
        : {},
    );
  },
  setFeedback(turnId: number, value: "up" | "down") {
    const next = { ...state.feedback };
    if (next[turnId] === value) delete next[turnId];
    else next[turnId] = value;
    set({ feedback: next });
  },
  setVoiceReplies(on: boolean) {
    set({ voiceReplies: on });
    try {
      window.localStorage.setItem(VOICE_KEY, on ? "on" : "off");
    } catch {}
  },
};
