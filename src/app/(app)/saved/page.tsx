"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useSavedItems, patchSavedItemsCache, refreshSavedItems } from "@/lib/hooks";
import { savedItemsApi, getErrorMessage, type SavedItem } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

const LINK_FOR: Record<string, (id: string) => string> = {
  recipe: (id) => ROUTES.recipe(id),
  order: (id) => ROUTES.menuItem(id),
  fast_hack: (id) => ROUTES.fastHack(id),
};

export default function SavedPage() {
  const { items, isLoading } = useSavedItems();
  const [pendingRemoval, setPendingRemoval] = useState<SavedItem | null>(null);

  async function confirmRemove() {
    if (!pendingRemoval) return;
    const { savedItemId } = pendingRemoval;
    try {
      await savedItemsApi.removeSavedItem(savedItemId);
      patchSavedItemsCache((list) => list.filter((i) => i.savedItemId !== savedItemId));
      toast.success("Removed from saved");
      void refreshSavedItems();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPendingRemoval(null);
    }
  }

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.heading}>Saved</h1>
        <p className={styles.subheading}>Recipes, orders, and Fast Hacks you&apos;ve kept.</p>
      </header>

      {isLoading ? (
        <div className={styles.center}>
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <div className={styles.center}>
          <p className={styles.emptyTitle}>Nothing saved yet</p>
          <p className={styles.emptyText}>
            Tap Save on any recipe or restaurant order to see it here.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => {
            const href = LINK_FOR[item.itemType]?.(item.itemId);
            return (
              <li key={item.savedItemId} className={styles.item}>
                <div className={styles.itemInfo}>
                  <p className={styles.itemTitle}>
                    {href ? <a href={href}>{item.title}</a> : item.title}
                  </p>
                  <p className={styles.itemMeta}>
                    {item.itemType.replace(/_/g, " ")}
                    {item.subtitle ? ` · ${item.subtitle}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className={styles.removeButton}
                  aria-label={`Remove ${item.title}`}
                  title="Remove"
                  onClick={() => setPendingRemoval(item)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remove from saved?"
        description={
          pendingRemoval
            ? `"${pendingRemoval.title}" will be removed from your saved items.`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        onCancel={() => setPendingRemoval(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
