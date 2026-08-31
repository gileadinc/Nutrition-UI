"use client";

import { toast } from "sonner";
import { DataState } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { useApiResource } from "@/lib/hooks";
import { savedItemsApi, getErrorMessage } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "./page.module.css";

const LINK_FOR: Record<string, (id: string) => string> = {
  recipe: (id) => ROUTES.recipe(id),
  order: (id) => ROUTES.menuItem(id),
  fast_hack: (id) => ROUTES.fastHack(id),
};

export default function SavedPage() {
  const saved = useApiResource(() => savedItemsApi.listSavedItems({ limit: 50 }), []);

  async function remove(savedItemId: string) {
    try {
      await savedItemsApi.removeSavedItem(savedItemId);
      toast.success("Removed");
      saved.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.heading}>Saved</h1>
        <p className={styles.subheading}>Recipes, orders, and Fast Hacks you&apos;ve kept.</p>
      </header>

      <DataState
        resource={saved}
        isEmpty={(d) => d.items.length === 0}
        emptyTitle="Nothing saved yet"
        emptyDescription="Tap Save on any recipe or restaurant order to see it here."
      >
        {(data) => (
          <ul className={styles.list}>
            {data.items.map((item) => {
              const href = LINK_FOR[item.itemType]?.(item.itemId);
              return (
                <li key={item.savedItemId} className={styles.item}>
                  <div>
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
                    size="sm"
                    onClick={() => remove(item.savedItemId)}
                  >
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DataState>
    </div>
  );
}
