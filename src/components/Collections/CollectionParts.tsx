"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/Icon";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import { AppTextField } from "@/components/TextField";
import { CheckMark } from "@/components/Layout";
import { SELECTED_CHIP } from "@/components/styles";
import { Link } from "@/lib/nav";
import { useCollections, useSaved } from "@/lib/store";
import type { SavedCollection, SavedItem } from "@/lib/api";
import { Dialog } from "./Dialog";

export const COLLECTION_NAME_MAX = 40;
const EMOJI_CHOICES = ["🍲", "🥗", "🍳", "🥑", "🍗", "🥦", "🍝", "🥞", "🍰", "⭐"];

export const itemCountLabel = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

function itemIcon(type: string): IconName {
  return type === "recipe" ? "chefHat" : "restaurant";
}

/** Cover for a collection: its emoji, else a 2x2 mosaic of the most recent items, else a folder. */
export function CollectionCover({
  collection,
  size = 56,
  className,
}: {
  collection: Pick<SavedCollection, "emoji" | "previewItems">;
  size?: number;
  className?: string;
}) {
  const box = "shrink-0 overflow-hidden rounded-2xl bg-brand-warm-gray";
  const style = { width: size, height: size };
  if (collection.emoji) {
    return (
      <span
        aria-hidden
        className={cn(box, "flex items-center justify-center", className)}
        style={{ ...style, fontSize: size * 0.5 }}
      >
        {collection.emoji}
      </span>
    );
  }
  const previews = collection.previewItems.slice(0, 4);
  if (previews.length === 0) {
    return (
      <span aria-hidden className={cn(box, "flex items-center justify-center", className)} style={style}>
        <Icon name="folder" size={Math.round(size * 0.45)} color="var(--color-text-secondary)" />
      </span>
    );
  }
  return (
    <span aria-hidden className={cn(box, "grid grid-cols-2 grid-rows-2 gap-0.5", className)} style={style}>
      {[0, 1, 2, 3].map((n) => {
        const p = previews[n];
        return (
          <span
            key={n}
            className={cn("flex items-center justify-center", p ? "bg-navy-50" : "bg-white/60")}
          >
            {p && (
              <Icon
                name={itemIcon(p.itemType)}
                size={Math.max(12, Math.round(size * 0.24))}
                color="var(--color-primary)"
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

/** Folder card on the Saved screen. */
export function CollectionCard({ collection }: { collection: SavedCollection }) {
  const titles = collection.previewItems.map((p) => p.title);
  const sub =
    collection.description || (titles.length ? titles.slice(0, 2).join(" · ") : "Empty so far");
  return (
    <Link
      to={`/you/saved/collections/${collection.collectionId}`}
      className="panel flex min-h-[80px] items-center gap-3 p-3 shadow-card transition-colors hover:bg-brand-warm-gray/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
    >
      <CollectionCover collection={collection} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm type-item-title text-text-primary">
          {collection.name}
        </span>
        <span className="block type-meta text-xs text-text-secondary">
          {itemCountLabel(collection.itemCount)}
        </span>
        <span className="block truncate type-meta text-xs text-text-secondary">{sub}</span>
      </span>
      <Icon name="chevronRight" size={16} color="var(--color-text-neutral-400)" />
    </Link>
  );
}

function validateName(name: string): string | undefined {
  const n = name.trim();
  if (!n) return "Give your collection a name.";
  if (n.length > COLLECTION_NAME_MAX) return `Keep it to ${COLLECTION_NAME_MAX} characters or fewer.`;
  return undefined;
}

function EmojiChoices({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <fieldset className="mt-4">
      <legend className="text-[12px] type-section-title text-text-secondary">Icon (optional)</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {EMOJI_CHOICES.map((e) => {
          const on = value === e;
          return (
            <button
              key={e}
              type="button"
              aria-pressed={on}
              aria-label={`Use ${e}`}
              onClick={() => onChange(on ? "" : e)}
              className={cn(
                "flex size-11 items-center justify-center rounded-xl border text-xl",
                on ? SELECTED_CHIP : "border-border-default bg-white hover:border-text-neutral-400",
              )}
            >
              {e}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Create (no `collection`) or rename/re-icon (with `collection`) dialog. */
export function CollectionFormDialog({
  collection,
  onClose,
  onDone,
}: {
  collection?: SavedCollection;
  onClose: () => void;
  /** Called with the saved collection after a successful create / update. */
  onDone?: (c: SavedCollection) => void;
}) {
  const { create, update } = useCollections();
  const [name, setName] = useState(collection?.name ?? "");
  const [emoji, setEmoji] = useState(collection?.emoji ?? "");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const error = touched ? validateName(name) : undefined;

  const submit = async () => {
    setTouched(true);
    if (validateName(name) || busy) return;
    setBusy(true);
    const input = { name: name.trim(), ...(emoji ? { emoji } : {}) };
    const saved = collection ? await update(collection.collectionId, input) : await create(input);
    setBusy(false);
    if (saved) {
      onDone?.(saved);
      onClose();
    }
  };

  return (
    <Dialog
      title={collection ? "Rename collection" : "New collection"}
      description={
        collection ? undefined : "A folder for saved recipes and hacks, like Weeknight dinners."
      }
      onClose={() => !busy && onClose()}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        noValidate
      >
        <AppTextField
          label="Collection name"
          value={name}
          onChange={(v) => setName(v.slice(0, COLLECTION_NAME_MAX + 10))}
          error={error}
          autoComplete="off"
          hint={error ? undefined : `${name.trim().length}/${COLLECTION_NAME_MAX}`}
        />
        <EmojiChoices value={emoji} onChange={setEmoji} />
        <div className="mt-6 grid grid-cols-2 gap-3">
          <SecondaryButton label="Cancel" onPress={onClose} disabled={busy} />
          <PrimaryButton
            label={busy ? "Saving…" : collection ? "Save" : "Create"}
            disabled={busy}
            onPress={() => void submit()}
          />
        </div>
      </form>
    </Dialog>
  );
}

/** "Add to collection" picker for one saved item: tick folders on/off, or create one inline. */
export function CollectionPicker({ item, onClose }: { item: SavedItem; onClose: () => void }) {
  const { collections, isLoading, error, create, setMembership } = useCollections();
  const saved = useSaved();
  // Read membership from the live saved-items cache so ticks follow optimistic updates.
  const live = saved.items.find((i) => i.savedItemId === item.savedItemId) ?? item;
  const member = new Set(live.collectionIds ?? []);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const nameError = touched ? validateName(name) : undefined;

  const add = async () => {
    setTouched(true);
    if (validateName(name) || busy) return;
    setBusy(true);
    const created = await create({ name: name.trim() });
    if (created) {
      setName("");
      setTouched(false);
      await setMembership(live, created.collectionId, true);
    }
    setBusy(false);
  };

  return (
    <Dialog title="Add to collection" description={item.title} onClose={onClose}>
      {isLoading ? (
        <p className="py-4 text-[13px] type-meta text-text-secondary">Loading your collections…</p>
      ) : error && collections.length === 0 ? (
        <p role="alert" className="py-4 text-[13px] type-meta text-error-red">
          Couldn&apos;t load your collections. {error}
        </p>
      ) : collections.length === 0 ? (
        <p className="pb-2 text-[13px] type-meta text-text-secondary">
          You don&apos;t have any collections yet. Name your first one below.
        </p>
      ) : (
        <ul aria-label="Collections" className="panel divide-y divide-border-divider overflow-hidden">
          {collections.map((c) => {
            const on = member.has(c.collectionId);
            return (
              <li key={c.collectionId}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => void setMembership(live, c.collectionId, !on)}
                  className="flex min-h-[60px] w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-brand-warm-gray/60"
                >
                  <CollectionCover collection={c} size={40} className="rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm type-item-title text-text-primary">
                      {c.name}
                    </span>
                    <span className="block type-meta text-xs text-text-secondary">
                      {itemCountLabel(c.itemCount)}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border",
                      on
                        ? "border-primary bg-primary text-white"
                        : "border-border-default bg-white text-transparent",
                    )}
                  >
                    {on && <CheckMark size={14} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <form
        className="mt-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <AppTextField
          label="New collection"
          value={name}
          onChange={(v) => setName(v.slice(0, COLLECTION_NAME_MAX + 10))}
          error={nameError}
          autoComplete="off"
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <SecondaryButton
            label={busy ? "Creating…" : "Create & add"}
            onPress={() => void add()}
            disabled={busy}
          />
          <PrimaryButton label="Done" onPress={onClose} />
        </div>
      </form>
    </Dialog>
  );
}

/** Destructive confirm; only its buttons close it (no scrim / Escape dismissal). */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog title={title} description={body} onClose={onCancel} dismissible={false} role="alertdialog">
      <div className="mt-2 grid grid-cols-2 gap-3">
        <SecondaryButton label="Cancel" onPress={onCancel} disabled={busy} />
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="h-14 rounded-2xl bg-brand-navy text-sm type-button text-text-on-dark disabled:opacity-60"
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
