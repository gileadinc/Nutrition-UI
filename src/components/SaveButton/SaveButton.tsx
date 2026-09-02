"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { savedItemsApi, getErrorMessage } from "@/lib/api";
import type { SaveItemInput } from "@/lib/api/endpoints/savedItems";
import { useSession } from "@/lib/auth";
import { patchSavedItemsCache, refreshSavedItems, useSavedItems } from "@/lib/hooks";

export function SaveButton(props: SaveItemInput) {
  const session = useSession();
  const { find, isLoading } = useSavedItems();
  const [busy, setBusy] = useState(false);

  if (!session.accessToken) return null;

  const existing = find(props.itemType, props.itemId);
  const saved = Boolean(existing);

  async function toggle() {
    setBusy(true);
    try {
      if (existing) {
        await savedItemsApi.removeSavedItem(existing.savedItemId);
        patchSavedItemsCache((items) =>
          items.filter((i) => i.savedItemId !== existing.savedItemId),
        );
        toast.success("Removed from saved");
      } else {
        const item = await savedItemsApi.saveItem(props);
        patchSavedItemsCache((items) => [item, ...items]);
        toast.success("Saved");
      }
      // Reconcile with the server in the background.
      void refreshSavedItems();
    } catch (err) {
      toast.error(getErrorMessage(err));
      void refreshSavedItems();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "outline"}
      onClick={toggle}
      disabled={busy || isLoading}
    >
      {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
