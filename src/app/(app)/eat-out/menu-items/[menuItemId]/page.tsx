"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DataState } from "@/components/DataState";
import { SaveButton } from "@/components/SaveButton";
import { useApiResource } from "@/lib/hooks";
import { eatOutApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import styles from "../../../detail.module.css";

export default function MenuItemDetailPage({
  params,
}: {
  params: Promise<{ menuItemId: string }>;
}) {
  const { menuItemId } = use(params);
  const item = useApiResource(() => eatOutApi.getMenuItem(menuItemId), [menuItemId]);

  return (
    <div>
      <DataState resource={item}>
        {(data) => (
          <>
            <Link href={ROUTES.restaurant(data.restaurantId)} className={styles.back}>
              <ArrowLeft className="size-4" />
              {data.restaurantName}
            </Link>

            <header className={styles.header}>
              <div>
                <h1 className={styles.title}>{data.name}</h1>
                <p className={styles.description}>{data.description}</p>
              </div>
              <SaveButton
                itemType="order"
                itemId={data.id}
                title={data.name}
                subtitle={data.restaurantName}
              />
            </header>

            <div className={styles.macros}>
              <div className={styles.macro}>
                <span className={styles.macroValue}>{data.calories}</span>
                <span className={styles.macroLabel}>Calories</span>
              </div>
              <div className={styles.macro}>
                <span className={styles.macroValue}>{data.protein} g</span>
                <span className={styles.macroLabel}>Protein</span>
              </div>
              <div className={styles.macro}>
                <span className={styles.macroValue}>{data.carbs} g</span>
                <span className={styles.macroLabel}>Carbs</span>
              </div>
              <div className={styles.macro}>
                <span className={styles.macroValue}>{data.fat} g</span>
                <span className={styles.macroLabel}>Fat</span>
              </div>
            </div>

            {data.whyThisWorks ? (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Why this works</h2>
                <p className={styles.description}>{data.whyThisWorks}</p>
              </section>
            ) : null}

            {data.whatToOrder?.length ? (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>What to order</h2>
                <div className={styles.guidance}>
                  {data.whatToOrder.map((line, i) => (
                    <span key={i} className={styles.pill}>
                      {line}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {data.swaps?.length ? (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Smart swaps</h2>
                <div className={styles.guidance}>
                  {data.swaps.map((line, i) => (
                    <span key={i} className={styles.pill}>
                      {line}
                    </span>
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
