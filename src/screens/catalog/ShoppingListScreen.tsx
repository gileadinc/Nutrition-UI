"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { SecondaryButton } from "@/components/Button";
import { PageContainer } from "@/components/Layout";
import { ConfirmDialog } from "@/components/Collections";
import { EmptyState } from "@/components/Feedback";
import { CONTROL_ON } from "@/components/styles";
import { useBack } from "@/lib/nav";
import { useShoppingList } from "@/lib/store";

const AISLES = [
  { key: "produce", label: "PRODUCE" },
  { key: "protein", label: "PROTEIN" },
  { key: "dairy", label: "DAIRY" },
  { key: "pantry", label: "PANTRY" },
] as const;
type Aisle = (typeof AISLES)[number]["key"];

const PRODUCE = [
  "lemon", "lime", "spinach", "kale", "tomato", "cucumber", "onion", "garlic", "pepper", "avocado",
  "apple", "berries", "vegetable", "veggie", "asparagus", "cabbage", "sweet potato", "salad", "herb", "lettuce",
];
const PROTEIN = ["chicken", "salmon", "turkey", "beef", "shrimp", "tofu", "egg", "lentil", "chickpea", "fillet"];
const DAIRY = ["yogurt", "milk", "cheese", "feta", "butter"];

function aisleOf(name: string): Aisle {
  const n = name.toLowerCase();
  if (PROTEIN.some((w) => n.includes(w))) return "protein";
  if (DAIRY.some((w) => n.includes(w))) return "dairy";
  if (PRODUCE.some((w) => n.includes(w))) return "produce";
  return "pantry";
}

export function ShoppingListScreen() {
  const back = useBack("/you");
  const list = useShoppingList();
  const [confirm, setConfirm] = useState<
    { kind: "item"; id: string; name: string } | { kind: "checked" } | { kind: "all" } | null
  >(null);
  const picked = list.items.filter((i) => i.checked).length;
  const groups = AISLES.map((a) => ({
    ...a,
    items: list.items.filter((i) => aisleOf(i.name) === a.key),
  })).filter((g) => g.items.length > 0);

  return (
    <PageContainer variant="focused" pathname="/shopping-list">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={back}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
        >
          <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
        </button>
        <h1 className="min-w-0 flex-1 text-2xl type-display tracking-[-1.08px] text-brand-navy">
          Shopping list
        </h1>
      </div>
      {list.items.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon="shoppingCart"
          title="Your list is empty"
          body="Open a recipe's ingredients and add what you don't already have."
          action={{ label: "Browse recipes", to: "/recipes" }}
        />
      ) : (
        <>
          <p className="mt-3 text-onb-meta type-meta text-text-secondary">
            {picked} of {list.items.length} picked up
          </p>
          <div className="mt-5 flex flex-col gap-6">
            {groups.map((g) => (
              <section key={g.key}>
                <h2 className="onb-eyebrow">{g.label}</h2>
                <ul className="mt-1 border-y border-border-divider">
                  {g.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center border-b border-border-divider last:border-b-0"
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={item.checked}
                        onClick={() => list.toggle(item.id)}
                        className="flex min-h-12 min-w-0 flex-1 items-center gap-3 py-3 text-left"
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-md border",
                            item.checked ? CONTROL_ON : "border-border-default",
                          )}
                        >
                          {item.checked && <Icon name="tick" size={13} color="var(--color-on-primary)" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-onb-body type-item-title",
                              item.checked ? "text-text-neutral-400 line-through" : "text-text-primary",
                            )}
                          >
                            {item.name}
                          </span>
                          {item.source && (
                            <span className="block text-onb-meta type-meta text-text-secondary">
                              {item.source}
                            </span>
                          )}
                        </span>
                        {item.quantity && (
                          <span className="shrink-0 text-onb-meta type-meta text-text-secondary">
                            {item.quantity}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => setConfirm({ kind: "item", id: item.id, name: item.name })}
                        className="-mr-2 ml-1 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-brand-warm-gray/70"
                      >
                        <Icon name="trash" size={16} color="var(--color-text-secondary)" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="mt-6 flex max-w-md flex-col gap-3">
            <SecondaryButton
              label="Clear picked up"
              className="text-onb-body"
              onPress={() => setConfirm({ kind: "checked" })}
              disabled={picked === 0}
            />
            <SecondaryButton
              label="Clear whole list"
              className="text-onb-body"
              onPress={() => setConfirm({ kind: "all" })}
            />
          </div>
        </>
      )}
      {confirm && (
        <ConfirmDialog
          title={
            confirm.kind === "item"
              ? `Remove ${confirm.name}?`
              : confirm.kind === "checked"
                ? "Clear picked-up items?"
                : "Clear your whole list?"
          }
          body={
            confirm.kind === "item"
              ? "It will be taken off your shopping list."
              : confirm.kind === "checked"
                ? `${picked} picked-up ${picked === 1 ? "item" : "items"} will be removed from the list.`
                : "Every item on your shopping list will be removed."
          }
          confirmLabel={confirm.kind === "item" ? "Yes, remove it" : "Yes, clear it"}
          onConfirm={() => {
            if (confirm.kind === "item") list.remove(confirm.id);
            else if (confirm.kind === "checked") list.clearChecked();
            else list.clearAll();
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </PageContainer>
  );
}
