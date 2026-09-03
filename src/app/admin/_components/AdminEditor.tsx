"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormErrorMessage } from "@/components/FormErrorMessage";
import { getErrorMessage, type PublishInput, type PublishStatus } from "@/lib/api";
import { useApiResource } from "@/lib/hooks";
import { StatusBadge } from "./StatusBadge";
import { SelectInput, TextArea } from "./fields";
import styles from "./admin-form.module.css";

const PUBLISH_STATUSES: { value: string; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "APPROVED", label: "Approved" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
];

interface CommonProps<T> {
  /** null in create mode; the id in edit mode. */
  id: string | null;
  listHref: string;
  titleNew: string;
  titleEdit: string;
  /** Renders the form fields; receives the loaded item (edit) or null (create). */
  children: (item: T | null) => ReactNode;
  /** Read the current form state into a create/update payload. */
  buildPayload: () => Record<string, unknown>;
  api: {
    get: (id: string) => Promise<T>;
    create: (body: never) => Promise<{ id: string }>;
    update: (id: string, body: never) => Promise<unknown>;
    remove: (id: string) => Promise<unknown>;
    publish: (id: string, body: PublishInput) => Promise<unknown>;
  };
  /** Href to view the item on this route after create. */
  editHref: (id: string) => string;
  currentStatus?: (item: T | null) => PublishStatus | null | undefined;
}

export function AdminEditor<T extends { id: string }>({
  id,
  listHref,
  titleNew,
  titleEdit,
  children,
  buildPayload,
  api,
  editHref,
  currentStatus,
}: CommonProps<T>) {
  const router = useRouter();
  const isEdit = id !== null;

  const item = useApiResource(
    () => (isEdit ? api.get(id) : Promise.resolve(null as T | null)),
    [id],
    { enabled: isEdit },
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [publishStatus, setPublishStatus] = useState("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const payload = buildPayload() as never;
      if (isEdit) {
        await api.update(id, payload);
        toast.success("Saved");
        item.refetch();
      } else {
        const created = await api.create(payload);
        toast.success("Created");
        router.push(editHref(created.id));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!isEdit) return;
    setPublishing(true);
    try {
      await api.publish(id, {
        status: publishStatus,
        reviewNotes: reviewNotes || undefined,
      });
      toast.success(`Status set to ${publishStatus.replace(/_/g, " ").toLowerCase()}`);
      item.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    try {
      await api.remove(id);
      toast.success("Deleted");
      router.push(listHref);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirmDelete(false);
    }
  }

  const loadedItem = isEdit ? item.data : null;
  const status = currentStatus?.(loadedItem);

  return (
    <div>
      <Link href={listHref} className={styles.back}>
        <ArrowLeft className="size-4" />
        Back to list
      </Link>

      <header className={styles.editorHeader}>
        <h1 className={styles.editorHeading}>{isEdit ? titleEdit : titleNew}</h1>
        {isEdit ? <StatusBadge status={status} /> : null}
      </header>

      {isEdit && item.isLoading && item.data === null ? (
        <div className={styles.center}>
          <Spinner />
        </div>
      ) : isEdit && item.error && item.data === null ? (
        <ErrorState
          title="Couldn't load this"
          description={item.error}
          action={
            <Button type="button" variant="outline" onClick={item.refetch}>
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            {children(loadedItem)}

            {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}

            <div className={styles.actions}>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : isEdit ? "Save changes" : "Create"}
              </Button>
              <Link href={listHref}>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>

          {isEdit ? (
            <>
              <section className={styles.panel}>
                <h2 className={styles.panelTitle}>Publish workflow</h2>
                <p className={styles.panelHint}>
                  Set the review status for this item. The backend also accepts
                  <code> reviewNotes</code>.
                </p>
                <div className={styles.publishRow}>
                  <SelectInput
                    label="Status"
                    value={publishStatus}
                    onChange={setPublishStatus}
                    options={PUBLISH_STATUSES}
                  />
                </div>
                <TextArea
                  label="Review notes (optional)"
                  value={reviewNotes}
                  onChange={setReviewNotes}
                  rows={2}
                />
                <Button type="button" onClick={handlePublish} disabled={publishing}>
                  {publishing ? "Updating…" : "Update status"}
                </Button>
              </section>

              <section className={styles.dangerPanel}>
                <h2 className={styles.panelTitle}>Delete</h2>
                <p className={styles.panelHint}>Permanently removes this item. Cannot be undone.</p>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </section>
            </>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this item?"
        description="This permanently removes it from the catalog and cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
