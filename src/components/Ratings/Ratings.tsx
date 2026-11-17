"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import { useMyRating, useRecipeReviews, useRequireAccount } from "@/lib/store";
import type { RecipeRating } from "@/lib/api";

const STAR_PATH =
  "M13.7276 3.44418L15.4874 6.99288C15.7274 7.48687 16.3673 7.9607 16.9073 8.05143L20.0969 8.58575C22.1367 8.92853 22.6167 10.4206 21.1468 11.8925L18.6671 14.3927C18.2471 14.8161 18.0172 15.6327 18.1471 16.2175L18.8571 19.3125C19.417 21.7623 18.1271 22.71 15.9774 21.4296L12.9877 19.6452C12.4478 19.3226 11.5579 19.3226 11.0079 19.6452L8.01827 21.4296C5.8785 22.71 4.57865 21.7522 5.13859 19.3125L5.84851 16.2175C5.97849 15.6327 5.74852 14.8161 5.32856 14.3927L2.84884 11.8925C1.389 10.4206 1.85895 8.92853 3.89872 8.58575L7.08837 8.05143C7.61831 7.9607 8.25824 7.48687 8.49821 6.99288L10.258 3.44418C11.2179 1.51861 12.7777 1.51861 13.7276 3.44418Z";

function Star({ size, filled }: { size: number; filled: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
      fill={filled ? "var(--color-badge-gold)" : "none"}
    >
      <path
        d={STAR_PATH}
        stroke={filled ? "var(--color-badge-gold)" : "var(--color-text-neutral-400)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Read-only row of five stars (rounded to the nearest whole star). */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const n = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} filled={i <= n} />
      ))}
    </span>
  );
}

export const formatAverage = (avg: number) => (Math.round(avg * 10) / 10).toFixed(1);

/** "★ 4.5 (12)" line for near the title; renders nothing when there are no ratings. */
export function RatingSummaryLine({
  average,
  count,
  className,
}: {
  average?: number | null;
  count?: number | null;
  className?: string;
}) {
  if (!count || average == null) return null;
  return (
    <p
      className={cn("flex items-center gap-1.5 text-[17px] type-meta text-text-secondary", className)}
      aria-label={`Rated ${formatAverage(average)} out of 5 from ${count} ${count === 1 ? "rating" : "ratings"}`}
    >
      <Stars value={average} size={15} />
      <span className="type-item-title text-text-primary">{formatAverage(average)}</span>
      <span>({count})</span>
    </p>
  );
}

/** Compact "★ 4.5" for cards; renders nothing without ratings. */
export function RatingBadge({ average, count }: { average?: number | null; count?: number | null }) {
  if (!count || average == null) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      <Star size={11} filled />
      {formatAverage(average)}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ReviewRow({ r }: { r: RecipeRating }) {
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2">
        <Stars value={r.rating} size={14} />
        <span className="sr-only">{r.rating} out of 5 stars</span>
        <span className="min-w-0 flex-1 truncate text-[17px] type-item-title text-text-primary">
          {r.authorName || "A ForkThis cook"}
        </span>
        <time dateTime={r.createdAt} className="shrink-0 text-xs type-meta text-text-secondary">
          {formatDate(r.createdAt)}
        </time>
      </div>
      {r.review && (
        <p className="mt-1.5 whitespace-pre-line text-onb-body text-text-primary">{r.review}</p>
      )}
    </li>
  );
}

const REVIEW_MAX = 500;

/** 5 tappable stars + optional review; submit / update / remove your own rating. */
function RateControl({ recipeId }: { recipeId: string }) {
  const requireAccount = useRequireAccount();
  const { mine, submit, remove } = useMyRating(recipeId);
  const [draft, setDraft] = useState<{ stars: number; text: string } | null>(null);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const textId = useId();

  const stars = draft?.stars ?? mine?.rating ?? 0;
  const text = draft?.text ?? mine?.review ?? "";
  const dirty =
    draft !== null && (draft.stars !== (mine?.rating ?? 0) || draft.text.trim() !== (mine?.review ?? ""));

  const set = (patch: Partial<{ stars: number; text: string }>) =>
    setDraft({ stars, text, ...patch });

  const save = async () => {
    if (!stars || busy) return;
    setBusy(true);
    const ok = await submit(stars, text);
    setBusy(false);
    if (ok) setDraft(null);
  };

  const clear = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await remove();
    setBusy(false);
    if (ok) setDraft(null);
  };

  const shown = hover || stars;
  return (
    <div className="rounded-2xl bg-brand-warm-gray p-4">
      <p className="text-onb-body type-section-title text-brand-navy">
        {mine ? "Your rating" : "Rate this recipe"}
      </p>
      <div
        role="radiogroup"
        aria-label="Your rating out of 5 stars"
        className="mt-2 flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={stars === i}
            aria-label={`${i} ${i === 1 ? "star" : "stars"}`}
            onMouseEnter={() => setHover(i)}
            onClick={() => requireAccount("Rating recipes") && set({ stars: i })}
            className="flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
          >
            <Star size={30} filled={i <= shown} />
          </button>
        ))}
      </div>
      {stars > 0 && (
          <div className="mt-3">
            <label htmlFor={textId} className="text-[16px] type-section-title text-text-secondary">
              Review (optional)
            </label>
            <textarea
              id={textId}
              rows={3}
              maxLength={REVIEW_MAX}
              value={text}
              onChange={(e) => set({ text: e.target.value })}
              placeholder="What did you think? Was it easy, filling, worth repeating?"
              className="mt-1.5 w-full resize-y rounded-2xl border border-border-default bg-white p-3 text-sm leading-5 text-text-primary outline-none placeholder:text-text-neutral-400 focus:border-focus focus:ring-[3px] focus:ring-focus/15"
            />
            <p className="mt-1 text-right text-xs type-meta text-text-secondary">
              {text.length}/{REVIEW_MAX}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {mine ? (
                <SecondaryButton
                  label="Remove rating"
                  className="h-11 text-onb-body"
                  disabled={busy}
                  onPress={() => void clear()}
                />
              ) : (
                <SecondaryButton
                  label="Clear"
                  className="h-11 text-onb-body"
                  disabled={busy || !draft}
                  onPress={() => setDraft(null)}
                />
              )}
              <PrimaryButton
                size="medium"
                label={busy ? "Saving…" : mine ? "Update" : "Submit"}
                disabled={busy || !dirty}
                onPress={() => void save()}
              />
            </div>
          </div>
      )}
    </div>
  );
}

/**
 * Ratings block for a recipe detail page: average + distribution, your rating, and the reviews
 * list ("Show more" when paged). Guests tapping a star are shown how to sign up; the write is
 * gated by `useRequireAccount` in the store.
 */
export function RecipeRatingsSection({ recipeId }: { recipeId: string }) {
  const reviews = useRecipeReviews(recipeId);
  const my = useMyRating(recipeId);
  const [more, setMore] = useState(false);
  // Your optimistic summary leads once loaded; otherwise the public one.
  const summary = my.summary ?? reviews.summary;
  const shown = reviews.reviews;

  return (
    <section aria-label="Ratings and reviews" className="border-t border-border-divider pt-5">
      <h2 className="text-onb-body type-section-title text-brand-navy">Ratings &amp; reviews</h2>
      <div className="mt-3 flex flex-col gap-4">
        {summary && summary.ratingCount > 0 && summary.averageRating != null && (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl type-display leading-none text-brand-navy">
                {formatAverage(summary.averageRating)}
              </p>
              <Stars value={summary.averageRating} size={14} />
              <p className="mt-0.5 text-xs type-meta text-text-secondary">
                {summary.ratingCount} {summary.ratingCount === 1 ? "rating" : "ratings"}
              </p>
            </div>
            <ul aria-label="Rating breakdown" className="flex min-w-0 flex-1 flex-col gap-1">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = summary.distribution[String(n) as "1"] ?? 0;
                return (
                  <li key={n} className="flex items-center gap-2 text-xs type-meta text-text-secondary">
                    <span className="w-3 text-right">{n}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-divider">
                      <span
                        className="block h-full rounded-full bg-badge-gold"
                        style={{ width: `${(c / summary.ratingCount) * 100}%` }}
                      />
                    </span>
                    <span className="w-5">{c}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <RateControl recipeId={recipeId} />
        {reviews.isLoading ? (
          <p className="type-meta text-[17px] text-text-secondary">Loading reviews…</p>
        ) : reviews.error && shown.length === 0 ? (
          <p role="alert" className="type-meta text-[17px] text-error-red">
            Couldn&apos;t load reviews. {reviews.error}
          </p>
        ) : shown.length === 0 ? (
          <p className="type-meta text-[17px] text-text-secondary">
            No reviews yet. Be the first to share how it turned out.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border-divider">
              {shown.map((r) => (
                <ReviewRow key={`${r.createdAt}-${r.authorName ?? ""}-${r.rating}`} r={r} />
              ))}
            </ul>
            {reviews.hasMore && (
              <SecondaryButton
                label={more ? "Loading…" : "Show more"}
                className="h-11 text-onb-body"
                disabled={more}
                onPress={() => {
                  setMore(true);
                  void reviews.loadMore().finally(() => setMore(false));
                }}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** Average + count under a recipe title. Shares the section's cached data (no extra requests); hidden at 0 ratings. */
export function RecipeRatingLine({
  recipeId,
  fallbackAverage,
  fallbackCount,
}: {
  recipeId: string;
  fallbackAverage?: number | null;
  fallbackCount?: number | null;
}) {
  const reviews = useRecipeReviews(recipeId);
  const my = useMyRating(recipeId);
  const summary = my.summary ?? reviews.summary;
  return (
    <RatingSummaryLine
      average={summary ? summary.averageRating : fallbackAverage}
      count={summary ? summary.ratingCount : fallbackCount}
      className="mt-1.5"
    />
  );
}
