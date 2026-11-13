"use client";

import { useEffect, useState } from "react";
import { CenteredShell, EmptyState, Icon, PageContainer, SecondaryButton, StatePanel } from "@/components";
import { CollectionFormDialog, ConfirmDialog, CollectionCover, itemCountLabel } from "@/components/Collections";
import { FoodCard } from "@/components/Cards";
import { DetailPageSkeleton } from "@/components/Feedback";
import { useBack, useNavigate, useParams } from "@/lib/nav";
import { useAppSession, useCollection, useCollections, useRequireAccount, useSaved } from "@/lib/store";
import type { SavedItem } from "@/lib/api";

const LINK = "tap-44 relative flex min-h-11 items-center gap-1.5 px-1 text-[14px] type-button text-primary";

export function CollectionDetailScreen() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const back = useBack("/you/saved");
  const session = useAppSession();
  const requireAccount = useRequireAccount();
  const detail = useCollection(id);
  const { remove, setMembership } = useCollections();
  const saved = useSaved();
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  // Guests get the account gate (and a panel behind it).
  useEffect(() => {
    if (session.ready && !session.isSignedIn) requireAccount("Collections");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the session settles
  }, [session.ready, session.isSignedIn]);

  if (!session.ready || (session.isSignedIn && detail.isLoading && !detail.data))
    return <DetailPageSkeleton />;

  if (!session.isSignedIn)
    return (
      <CenteredShell>
        <StatePanel
          icon="lock"
          title="Collections need an account"
          body="Create a free account to organise your saved recipes and hacks into folders."
          primary={{ label: "Create free account", to: "/signup" }}
          secondary={{ label: "Back to saved", to: "/you/saved" }}
        />
      </CenteredShell>
    );

  const c = detail.data;
  if (!c)
    return (
      <CenteredShell>
        <StatePanel
          icon="folder"
          title="That collection isn't here"
          body={
            detail.error && !/not found/i.test(detail.error)
              ? detail.error
              : "It may have been deleted. Your saved recipes are unaffected."
          }
          primary={{ label: "Back to saved", to: "/you/saved" }}
          secondary={{ label: "Browse recipes", to: "/recipes" }}
        />
      </CenteredShell>
    );

  // Hearts that were un-saved elsewhere drop out right away.
  const live = new Set(saved.items.map((i) => i.savedItemId));
  const isLive = (i: SavedItem) => saved.isLoading || live.has(i.savedItemId);
  const items = c.items.filter(isLive);

  const removeItem = (item: SavedItem) => {
    detail.mutate((prev) =>
      prev
        ? {
            ...prev,
            itemCount: Math.max(0, prev.itemCount - 1),
            items: prev.items.filter((i) => i.savedItemId !== item.savedItemId),
          }
        : c,
    );
    void setMembership(item, c.collectionId, false);
  };

  const doDelete = async () => {
    setBusy(true);
    const ok = await remove(c);
    setBusy(false);
    if (ok) navigate("/you/saved", { replace: true });
    else setConfirming(false);
  };

  return (
    <PageContainer className="max-w-[1400px]">
      <header className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={back}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
        >
          <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
        </button>
        <CollectionCover collection={c} size={44} className="rounded-xl" />
        <div className="min-w-0 flex-1">
          <h1
            className="truncate text-2xl type-display text-brand-navy"
            style={{ letterSpacing: "-1.08px" }}
          >
            {c.name}
          </h1>
          <p className="mt-0.5 text-sm type-meta text-text-secondary">
            {itemCountLabel(items.length)}
            {c.description ? ` · ${c.description}` : ""}
          </p>
        </div>
        <button
          type="button"
          aria-label="Rename collection"
          onClick={() => setRenaming(true)}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
        >
          <Icon name="pencilEdit" size={16} color="var(--color-primary)" />
        </button>
      </header>

      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="folder"
          title="This collection is empty"
          body="Open Saved and use Add to collection on a recipe or hack to file it here."
          action={{ label: "Go to saved", to: "/you/saved" }}
        />
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => {
            const recipe = i.itemType === "recipe";
            return (
              <li key={i.savedItemId} className="min-w-0">
                <FoodCard
                  layout="grid"
                  title={i.title}
                  subtitle={i.subtitle ?? undefined}
                  brandName={recipe ? undefined : (i.subtitle ?? undefined)}
                  meta={i.subtitle ?? (recipe ? "Recipe" : "Fast hack")}
                  saved
                  onSave={() =>
                    void saved.toggle({
                      itemType: i.itemType,
                      itemId: i.itemId,
                      title: i.title,
                      subtitle: i.subtitle ?? undefined,
                    })
                  }
                  to={recipe ? `/recipes/${i.itemId}` : `/hack/${i.itemId}`}
                />
                <button type="button" onClick={() => removeItem(i)} className={LINK}>
                  <Icon name="close" size={14} color="var(--color-primary)" />
                  Remove from collection
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 max-w-xs">
        <SecondaryButton label="Delete collection" onPress={() => setConfirming(true)} />
      </div>

      {renaming && <CollectionFormDialog collection={c} onClose={() => setRenaming(false)} />}
      {confirming && (
        <ConfirmDialog
          title={`Delete ${c.name}?`}
          body="The collection goes away. Everything in it stays in your saved list."
          confirmLabel="Yes, delete it"
          busy={busy}
          onConfirm={() => void doDelete()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </PageContainer>
  );
}
