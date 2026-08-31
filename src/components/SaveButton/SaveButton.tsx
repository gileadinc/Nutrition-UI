"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { savedItemsApi, getErrorMessage } from "@/lib/api";
import type { SaveItemInput } from "@/lib/api/endpoints/savedItems";
import { useSession } from "@/lib/auth";

export function SaveButton(props: SaveItemInput) {
  const session = useSession();
  const [saved, setSaved] = useState(false);
  const [savedItemId, setSavedItemId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!session.accessToken) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (saved && savedItemId) {
        await savedItemsApi.removeSavedItem(savedItemId);
        setSaved(false);
        setSavedItemId(null);
        toast.success("Removed from saved");
      } else {
        const item = await savedItemsApi.saveItem(props);
        setSaved(true);
        setSavedItemId(item.savedItemId);
        toast.success("Saved");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant={saved ? "secondary" : "outline"} onClick={toggle} disabled={busy}>
      {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
