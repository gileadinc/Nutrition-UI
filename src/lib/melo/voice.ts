"use client";

/**
 * Browser speech APIs (Web Speech): SpeechRecognition for voice questions and speechSynthesis for
 * "read aloud". Everything feature-detects; unsupported browsers simply don't get the controls.
 */

import { useSyncExternalStore } from "react";
import { MELO_COPY } from "@/content";

/* eslint-disable @typescript-eslint/no-explicit-any */
const w = () => (typeof window === "undefined" ? ({} as any) : (window as any));

export const canRecognize = () => typeof (w().SpeechRecognition ?? w().webkitSpeechRecognition) === "function";
export const canSpeak = () =>
  typeof window !== "undefined" && !!w().speechSynthesis && typeof w().SpeechSynthesisUtterance === "function";

const noop = () => () => {};
/** Hydration-safe "does this browser support voice input / output". */
export const useCanRecognize = () => useSyncExternalStore(noop, canRecognize, () => false);
export const useCanSpeak = () => useSyncExternalStore(noop, canSpeak, () => false);

const language = () => (typeof navigator !== "undefined" && navigator.language) || "en-US";

export type VoiceError = "denied" | "no-speech" | "network" | "unavailable";
export const VOICE_MESSAGES: Record<VoiceError, string> = MELO_COPY.voiceMessages;

const mapError = (code: string): VoiceError | null => {
  switch (code) {
    case "aborted":
      return null;
    case "not-allowed":
    case "service-not-allowed":
      return "denied";
    case "no-speech":
      return "no-speech";
    case "network":
      return "network";
    default:
      return "unavailable";
  }
};

const SILENCE_MS = 2000;
const MAX_MS = 30000;
const GRACE_MS = 1500;

export interface Listener {
  stop(): void;
  abort(): void;
}

type EndReason = "ended" | "stopped" | "silence" | "max" | "error";

let activeListener: Listener | null = null;

/** Start one dictation. Returns null when unsupported. */
export function listen(opts: {
  onTranscript: (text: string, final: boolean) => void;
  onEnd: (reason: EndReason, error?: VoiceError) => void;
}): Listener | null {
  const Ctor = w().SpeechRecognition ?? w().webkitSpeechRecognition;
  if (typeof Ctor !== "function") return null;
  stopSpeaking();
  let rec: any;
  try {
    rec = new Ctor();
  } catch {
    opts.onEnd("error", "unavailable");
    return { stop() {}, abort() {} };
  }
  rec.lang = language();
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let done = false;
  let aborted = false;
  let reason: EndReason = "ended";
  let error: VoiceError | undefined;
  let silence: ReturnType<typeof setTimeout> | undefined;
  let grace: ReturnType<typeof setTimeout> | undefined;
  const handle: Listener = {
    stop: () => request("stopped"),
    abort: () => {
      if (done) return;
      aborted = true;
      try {
        rec.abort();
      } catch {}
      finish();
    },
  };
  function finish() {
    if (done) return;
    done = true;
    clearTimeout(silence);
    clearTimeout(grace);
    clearTimeout(max);
    if (activeListener === handle) activeListener = null;
    if (!aborted) opts.onEnd(reason, error);
  }
  function request(why: "stopped" | "silence" | "max") {
    if (done) return;
    if (reason === "ended") reason = why;
    try {
      rec.stop();
    } catch {
      finish();
      return;
    }
    clearTimeout(grace);
    grace = setTimeout(finish, GRACE_MS);
  }
  rec.onresult = (e: any) => {
    if (done) return;
    let text = "";
    let final = true;
    for (let i = 0; i < e.results.length; i++) {
      text += e.results[i][0]?.transcript ?? "";
      if (!e.results[i].isFinal) final = false;
    }
    opts.onTranscript(text.replace(/\s+/g, " ").trim(), final);
    clearTimeout(silence);
    silence = setTimeout(() => request("silence"), SILENCE_MS);
  };
  rec.onerror = (e: any) => {
    const code = mapError(e.error);
    if (code) {
      error = code;
      reason = "error";
    }
  };
  rec.onend = finish;
  const max = setTimeout(() => request("max"), MAX_MS);
  activeListener = handle;
  try {
    rec.start();
  } catch {
    error = "unavailable";
    reason = "error";
    finish();
  }
  return handle;
}

/* ---------------------------------------------------------- read aloud */

let speakingId: string | null = null;
let token = 0;
const subs = new Set<() => void>();
function setSpeaking(id: string | null) {
  if (speakingId !== id) {
    speakingId = id;
    subs.forEach((s) => s());
  }
}

/** Id of the answer being read aloud, or null. */
export const useSpeakingId = () =>
  useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => void subs.delete(cb);
    },
    () => speakingId,
    () => null,
  );

function pickVoice(voices: SpeechSynthesisVoice[], lang: string) {
  const base = lang.toLowerCase().split("-")[0] || "en";
  const same = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(base));
  if (same.length === 0) return null;
  const exact = same.filter((v) => v.lang.toLowerCase().replace("_", "-") === lang.toLowerCase());
  const pool = exact.length ? exact : same;
  const nice = /natural|neural|premium|enhanced|siri|samantha|google/i;
  return (
    pool.find((v) => nice.test(v.name) && v.localService) ??
    pool.find((v) => nice.test(v.name)) ??
    pool.find((v) => v.default) ??
    pool.find((v) => v.localService) ??
    pool[0]
  );
}

export function speak(id: string, text: string): boolean {
  if (!canSpeak()) return false;
  activeListener?.stop();
  const mine = ++token;
  const synth = w().speechSynthesis as SpeechSynthesis;
  synth.cancel();
  const u = new (w().SpeechSynthesisUtterance)(text) as SpeechSynthesisUtterance;
  u.lang = language();
  u.rate = 1;
  u.voice = pickVoice(synth.getVoices(), u.lang);
  const end = () => {
    if (token === mine) setSpeaking(null);
  };
  u.onend = end;
  u.onerror = end;
  setSpeaking(id);
  try {
    synth.speak(u);
  } catch {
    end();
    return false;
  }
  return true;
}

export function stopSpeaking() {
  token++;
  setSpeaking(null);
  try {
    if (canSpeak()) (w().speechSynthesis as SpeechSynthesis).cancel();
  } catch {}
}

/** Plain text for the speech engine: units spelled out, separators softened. */
export function spokenText(text: string, cards: { title: string; calories: number }[] = []) {
  const t = text
    .replace(/(\d)\s?kcal\b/g, "$1 calories")
    .replace(/\bkcal\b/g, "calories")
    .replace(/(\d)\s?g\b/g, "$1 grams")
    .replace(/\s*[—–·]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  return [
    /[.!?]$/.test(t) ? t : `${t}.`,
    ...cards.map((c) => `${c.title}, ${c.calories.toLocaleString("en-US")} calories.`),
  ].join(" ");
}
