"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DataState } from "@/components/DataState";
import { ItemCard } from "@/components/ItemCard";
import { SaveButton } from "@/components/SaveButton";
import { useApiResource } from "@/lib/hooks";
import { eatOutApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "../../../detail.module.css";

export default function FastHackDetailPage({
  params,
}: {
  params: Promise<{ fastHackId: string }>;
}) {
  const { fastHackId } = use(params);
  const hack = useApiResource(() => eatOutApi.getFastHack(fastHackId), [fastHackId]);
  const similar = useApiResource(
    () => eatOutApi.getSimilarFastHacks(fastHackId, 4),
    [fastHackId],
  );

  return (
    <div>
      <Link href={ROUTES.eatOut} className={styles.back}>
        <ArrowLeft className="size-4" />
        Eat out
      </Link>

      <DataState resource={hack}>
        {(data) => (
          <>
            <header className={styles.header}>
              <div>
                <h1 className={styles.title}>{data.title}</h1>
                <p className={styles.description}>{data.summary ?? data.description}</p>
              </div>
              <SaveButton itemType="fast_hack" itemId={data.id} title={data.title} />
            </header>

            {similar.data && similar.data.length > 0 ? (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Similar Fast Hacks</h2>
                <div className={styles.grid}>
                  {similar.data.map((item) => (
                    <ItemCard
                      key={item.id}
                      href={ROUTES.fastHack(item.id)}
                      title={item.title}
                      subtitle={item.summary ?? item.description}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </DataState>
    </div>
  );
}
