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

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = use(params);
  const restaurant = useApiResource(
    () => eatOutApi.getRestaurant(restaurantId),
    [restaurantId],
  );

  return (
    <div>
      <Link href={ROUTES.eatOut} className={styles.back}>
        <ArrowLeft className="size-4" />
        Eat out
      </Link>

      <DataState resource={restaurant}>
        {(data) => (
          <>
            <header className={styles.header}>
              <div>
                <h1 className={styles.title}>{data.name}</h1>
                <p className={styles.description}>{data.summary}</p>
                <p className={styles.description}>
                  {data.city}, {data.state}
                  {data.distanceMiles ? ` · ${data.distanceMiles} mi` : ""} ·{" "}
                  {data.testedOrderCount} tested orders
                </p>
              </div>
              <SaveButton
                itemType="order"
                itemId={data.id}
                title={data.name}
                subtitle={`${data.city}, ${data.state}`}
              />
            </header>

            {data.menuItems?.length ? (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>What to order</h2>
                <div className={styles.grid}>
                  {data.menuItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      href={ROUTES.menuItem(item.id)}
                      title={item.name}
                      subtitle={item.description}
                      meta={`${item.calories} kcal · ${item.protein}g protein`}
                      tags={item.goalTags}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <p className={styles.description}>No menu items published for this restaurant yet.</p>
            )}
          </>
        )}
      </DataState>
    </div>
  );
}
