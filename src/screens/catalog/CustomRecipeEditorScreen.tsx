"use client";

import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { AppImage } from "@/components/AppImage";
import { PrimaryButton, SecondaryButton } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { AppTextField } from "@/components/TextField";
import { SheetFrame } from "@/components/Track/LogSheet";
import { CenteredShell, StatePanel, NutritionLine } from "@/components";
import { useNavigate, useParams, useSearchParams } from "@/lib/nav";
import {
  UNIT_LABEL,
  deleteCustomRecipe,
  emptyRecipe,
  ingredientMacros,
  newIngredient,
  parseIngredients,
  recipeNutrition,
  recipeProblems,
  saveCustomRecipe,
  searchFoods,
  unitsFor,
  useCustomRecipe,
  type CustomRecipe,
  type IngredientUnit,
  type Macros,
  type RecipeIngredient,
} from "@/lib/store/customRecipes";
import { toast, useRequireAccount } from "@/lib/store";
import { cn } from "@/lib/utils";

const MAX_PHOTO = 12 * 1024 * 1024;

/** Downscale a chosen photo to a small JPEG data URL so it fits in local storage. */
async function readPhoto(
  file: File,
  maxSide = 720,
  quality = 0.8,
): Promise<{ ok: true; dataUrl: string } | { ok: false; reason: string }> {
  if (!file.type.startsWith("image/")) return { ok: false, reason: "Choose an image file." };
  if (file.size > MAX_PHOTO)
    return { ok: false, reason: "That photo is over 12 MB. Try a smaller one." };
  try {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("decode"));
        el.src = url;
      });
      const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * k));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * k));
      const ctx = canvas.getContext("2d");
      if (!ctx) return { ok: false, reason: "This browser could not read that photo." };
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return { ok: true, dataUrl: canvas.toDataURL("image/jpeg", quality) };
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return { ok: false, reason: "That photo could not be opened. Try another." };
  }
}

const PROBLEM_TEXT = {
  title: "Give the recipe a name.",
  servings: "Enter how many servings it makes (1–100).",
  ingredients: "Add at least one ingredient.",
} as const;

export function CustomRecipeEditorScreen() {
  const { id } = useParams<{ id?: string }>();
  const [params] = useSearchParams();
  const existing = useCustomRecipe(id);
  if (id && !existing)
    return (
      <CenteredShell>
        <StatePanel
          icon="search"
          title="That recipe isn't here"
          body="It may have been deleted. Meals you logged from it are still in your log."
          primary={{ label: "My recipes", to: "/recipes" }}
          secondary={{ label: "Go to Home", to: "/home" }}
        />
      </CenteredShell>
    );
  return <Editor key={id ?? `new-${params.get("fromMeal") ?? ""}`} existing={existing} />;
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-2xl border p-3"
      style={{
        backgroundColor: "var(--color-missed-dose-surface)",
        borderColor: "color-mix(in srgb, var(--color-status-over) 35%, transparent)",
      }}
    >
      <span className="mt-0.5 shrink-0">
        <Icon name="alert" size={16} color="var(--color-status-over)" />
      </span>
      <p className="text-onb-body text-text-primary">{children}</p>
    </div>
  );
}

function Editor({ existing }: { existing: CustomRecipe | undefined }) {
  const navigate = useNavigate();
  const requireAccount = useRequireAccount();
  const editing = existing !== undefined;
  const [draft, setDraft] = useState<CustomRecipe>(() => existing ?? emptyRecipe());
  const [servings, setServings] = useState(String(draft.servings));
  const [finished, setFinished] = useState(
    draft.finishedGrams === null ? "" : String(draft.finishedGrams),
  );
  const [tried, setTried] = useState(false);
  const [step, setStep] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [paste, setPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [review, setReview] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const titleId = "custom-recipe-editor-title";

  const patch = (p: Partial<CustomRecipe>) => setDraft((d) => ({ ...d, ...p }));
  const setIngredient = (i: RecipeIngredient) => {
    setDraft((d) => ({ ...d, ingredients: d.ingredients.map((x) => (x.id === i.id ? i : x)) }));
    setReview((s) => {
      if (!s.has(i.id)) return s;
      const n = new Set(s);
      n.delete(i.id);
      return n;
    });
  };
  const addIngredients = (list: RecipeIngredient[]) =>
    setDraft((d) => ({ ...d, ingredients: [...d.ingredients, ...list] }));
  const removeIngredient = (id: string) =>
    setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((x) => x.id !== id) }));

  const nutrition = useMemo(() => recipeNutrition(draft), [draft]);
  const problems = useMemo(() => recipeProblems(draft), [draft]);
  const err = (k: keyof typeof PROBLEM_TEXT) =>
    tried && problems.includes(k) ? PROBLEM_TEXT[k] : undefined;

  const next = () => {
    setTried(true);
    if (step === 0 && (problems.includes("title") || problems.includes("servings"))) return;
    if (step === 1 && problems.includes("ingredients")) return;
    setTried(false);
    setStep((s) => Math.min(2, s + 1));
  };

  const onServings = (v: string) => {
    setServings(v);
    const n = Number(v);
    patch({ servings: Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0 });
  };
  const onFinished = (v: string) => {
    setFinished(v);
    const n = Number(v);
    patch({ finishedGrams: v.trim() !== "" && Number.isFinite(n) && n > 0 ? n : null });
  };
  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    const r = await readPhoto(file);
    if (r.ok) {
      setPhotoError(null);
      patch({ photo: r.dataUrl });
    } else setPhotoError(r.reason);
  };
  const readIngredients = () => {
    const list = parseIngredients(pasteText);
    if (list.length === 0) {
      toast.info("No ingredients found", {
        body: "Put one ingredient on each line, like “200 g chicken breast”.",
      });
      return;
    }
    addIngredients(list);
    setReview((s) => new Set([...s, ...list.map((x) => x.id)]));
    setPasteText("");
    setPaste(false);
    toast.success(`${list.length} ${list.length === 1 ? "ingredient" : "ingredients"} added`, {
      body: "Check each one before you save.",
    });
  };
  const save = () => {
    setTried(true);
    if (problems.length > 0 || !requireAccount("Saving recipes")) return;
    const saved = saveCustomRecipe(draft);
    toast.success(editing ? `${saved.title} updated` : `${saved.title} saved`, {
      body: editing
        ? "Meals you already logged are unchanged."
        : "Find it under CookThis! › My recipes.",
    });
    navigate(`/recipes/mine/${saved.id}`, { replace: true });
  };
  const remove = () => {
    if (!existing) return;
    deleteCustomRecipe(existing.id);
    toast.success(`${existing.title} deleted`, {
      body: "Meals you logged from it are still in your log.",
    });
    navigate("/recipes", { replace: true });
  };

  return (
    <SheetFrame
      labelledBy={titleId}
      onClose={() => navigate(-1)}
      className="max-h-[96dvh] px-0 pb-0 md:max-w-[941px] md:rounded-[20px] md:px-0 md:pb-0"
    >
      <header className="sticky top-0 z-20 flex flex-row-reverse items-center justify-between gap-4 bg-white px-5 pb-5 pt-5 md:px-6 md:pt-6">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-white"
        >
          <Icon name="arrowBack" size={20} color="var(--color-text-primary)" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="onb-eyebrow">{editing ? "Your recipe" : "New recipe"}</p>
          <h1
            id={titleId}
            className="mt-1 text-[24px] type-display leading-8 tracking-[-1px] text-brand-navy md:text-[28px]"
          >
            {editing ? "Edit recipe" : "Create a recipe"}
          </h1>
        </div>
      </header>
      <nav
        aria-label="Recipe progress"
        className="border-y border-border-divider bg-brand-cream px-5 py-4 md:px-6"
      >
        <ol className="grid grid-cols-3 gap-2">
          {["Basics", "Ingredients", "Review"].map((label, i) => (
            <li key={label} aria-current={i === step ? "step" : undefined} className="min-w-0">
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-colors",
                  i <= step ? "bg-brand-navy" : "bg-border-divider",
                )}
              />
              <span
                className={cn(
                  "mt-2 block text-[12px] type-button",
                  i === step ? "text-brand-navy" : "text-text-secondary",
                )}
              >
                {i + 1}. {label}
              </span>
            </li>
          ))}
        </ol>
      </nav>
      <form
        noValidate
        className="grid gap-5 px-5 pb-5 md:grid-cols-[minmax(0,1fr)_280px] md:px-6 md:pb-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 2) next();
          else save();
        }}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <section
            aria-label="Photo"
            style={{ display: step === 0 ? undefined : "none" }}
            className="panel order-2 flex flex-col gap-2 overflow-hidden p-3"
          >
            <p className="onb-eyebrow">Photo</p>
            {draft.photo ? (
              <div className="relative">
                <AppImage
                  src={draft.photo}
                  alt=""
                  className="h-[124px] w-full rounded-xl object-cover"
                />
                <div className="absolute inset-x-3 bottom-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="tap-44 relative flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border-default bg-white text-[13px] type-button-secondary text-primary"
                  >
                    <Icon name="camera" size={16} color="var(--color-primary)" />
                    Replace photo
                  </button>
                  <button
                    type="button"
                    onClick={() => patch({ photo: null })}
                    className="tap-44 relative flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border-default bg-white text-[13px] type-button-secondary text-text-primary"
                  >
                    Remove photo
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-[124px] w-full flex-col items-center justify-center gap-1 rounded-xl bg-brand-warm-gray text-text-secondary"
              >
                <Icon name="camera" size={22} color="var(--color-text-secondary)" />
                <span className="text-onb-body type-item-title text-text-primary">Add a photo</span>
                <span className="text-onb-meta type-meta">
                  Optional. It is only for show — it does not fill in ingredients.
                </span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Choose a recipe photo"
              tabIndex={-1}
              onChange={(e) => {
                void onPhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {photoError && (
              <p
                role="alert"
                className="flex items-center gap-1.5 px-4 py-2 text-xs type-meta text-error-red"
              >
                <Icon name="alert" size={14} color="currentColor" />
                {photoError}
              </p>
            )}
          </section>

          <section
            aria-label="Basics"
            style={{ display: step === 0 ? undefined : "none" }}
            className="panel order-1 flex flex-col gap-3 p-5"
          >
            <p className="onb-eyebrow">Basics</p>
            <AppTextField
              label="Recipe name"
              value={draft.title}
              onChange={(v) => patch({ title: v })}
              error={err("title")}
              placeholder="My everyday breakfast"
            />
            <AppTextField
              label="Servings it makes"
              type="number"
              value={servings}
              onChange={onServings}
              error={err("servings")}
              hint="When you log it you choose how many servings you ate."
            />
          </section>

          <section
            aria-labelledby="ingredients-heading"
            style={{ display: step === 1 ? undefined : "none" }}
            className="panel order-1 p-4 md:p-5"
          >
            <div className="flex items-baseline gap-2">
              <h2
                id="ingredients-heading"
                className="flex-1 whitespace-nowrap text-onb-body type-section-title text-brand-navy"
              >
                Ingredients{" "}
                <span className="type-meta text-text-secondary">({draft.ingredients.length})</span>
              </h2>
              <button
                type="button"
                aria-expanded={paste}
                onClick={() => setPaste((v) => !v)}
                className="tap-44 relative text-[13px] type-button text-primary"
              >
                {paste ? "Close paste" : "Paste a recipe"}
              </button>
            </div>
            {paste && (
              <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-brand-warm-gray p-3">
                <label
                  htmlFor="paste-recipe"
                  className="text-[13px] type-item-title text-text-primary"
                >
                  One ingredient per line
                </label>
                <textarea
                  id="paste-recipe"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={5}
                  placeholder={"200 g chicken breast\n2 cups cooked rice\n1 tbsp olive oil\n3 eggs"}
                  className="w-full rounded-xl border border-border-default bg-white p-3 text-sm leading-5 text-text-primary outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/15"
                />
                <p className="text-onb-meta type-meta text-text-secondary">
                  We read the amounts and match what we can. You check every line before saving.
                </p>
                <SecondaryButton
                  label="Read ingredients"
                  className="h-11 text-onb-body"
                  onPress={readIngredients}
                  disabled={!pasteText.trim()}
                />
              </div>
            )}
            {err("ingredients") && (
              <p
                role="alert"
                className="mt-3 flex items-center gap-1.5 text-xs type-meta text-error-red"
              >
                <Icon name="alert" size={14} color="currentColor" />
                {err("ingredients")}
              </p>
            )}
            {draft.ingredients.length > 0 && (
              <ul className="mt-3 flex flex-col divide-y divide-border-divider">
                {draft.ingredients.map((i) => (
                  <IngredientRow
                    key={i.id}
                    ingredient={i}
                    needsReview={review.has(i.id)}
                    defaultOpen={open.has(i.id)}
                    onChange={setIngredient}
                    onRemove={() => removeIngredient(i.id)}
                  />
                ))}
              </ul>
            )}
            {draft.ingredients.length === 0 && (
              <p className="mt-3 text-onb-meta type-meta text-text-secondary">
                Search a food below to add it, or paste a whole recipe. Totals update as you go.
              </p>
            )}
            <AddIngredient
              onAdd={(i, own) => {
                addIngredients([i]);
                if (own) setOpen((s) => new Set(s).add(i.id));
              }}
            />
          </section>

          <section
            aria-label="Nutrition"
            style={{ display: step === 2 ? undefined : "none" }}
            className="panel order-1 flex flex-col gap-4 p-5"
          >
            <p className="onb-eyebrow">Nutrition</p>
            <NutritionLine {...nutrition.perServing} label="Nutrition per serving" />
            <p className="text-onb-meta type-meta text-text-secondary">
              Whole recipe: {nutrition.total.calories.toLocaleString("en-US")} kcal ·{" "}
              {nutrition.total.protein}g protein · {nutrition.total.carbs}g carbs ·{" "}
              {nutrition.total.fat}g fat
            </p>
            {nutrition.incomplete > 0 && (
              <Notice>
                {nutrition.incomplete}{" "}
                {nutrition.incomplete === 1 ? "ingredient has" : "ingredients have"} no nutrition
                yet, so the totals leave {nutrition.incomplete === 1 ? "it" : "them"} out. You can
                still save.
              </Notice>
            )}
            <p className="text-onb-meta type-meta text-text-secondary">
              These are estimates. Check labels if you need exact figures, and follow your care
              team&apos;s guidance.
            </p>
            <div className="border-t border-border-divider pt-3">
              <AppTextField
                label="Finished weight (g)"
                type="number"
                value={finished}
                onChange={onFinished}
                hint={
                  nutrition.totalGrams === null
                    ? "Optional. Add it to log this recipe by grams."
                    : nutrition.gramsFromFinished
                      ? `Logging by grams uses ${Math.round(nutrition.totalGrams)} g for the whole dish.`
                      : `Optional. Without it, grams logging uses the raw ingredients (${Math.round(nutrition.totalGrams)} g). Weigh the cooked dish for a closer figure.`
                }
              />
            </div>
          </section>

          <div className="order-4 flex flex-wrap gap-3 border-t border-border-divider pt-4">
            {step > 0 && (
              <SecondaryButton
                label="Previous"
                onPress={() => {
                  setTried(false);
                  setStep((s) => s - 1);
                }}
                className="h-12 flex-1"
              />
            )}
            <PrimaryButton
              type="submit"
              label={step < 2 ? "Continue" : editing ? "Save changes" : "Save recipe"}
              className="h-12 flex-1"
            />
            {editing && !confirmDelete && (
              <SecondaryButton
                label="Delete recipe"
                onPress={() => setConfirmDelete(true)}
                className="basis-full"
              />
            )}
            {editing && confirmDelete && (
              <div
                role="alertdialog"
                aria-label="Delete this recipe?"
                className="panel flex flex-col gap-3 p-4"
              >
                <p className="text-onb-body text-text-primary">
                  Delete “{existing?.title}”? Meals you already logged from it stay in your log
                  exactly as they are.
                </p>
                <div className="flex gap-3">
                  <SecondaryButton label="Keep it" onPress={() => setConfirmDelete(false)} />
                  <PrimaryButton label="Delete" onPress={remove} />
                </div>
              </div>
            )}
          </div>
        </div>

        <aside
          aria-label="Live recipe preview"
          className="panel h-fit overflow-hidden p-0 md:sticky md:top-3"
        >
          {draft.photo ? (
            <AppImage src={draft.photo} alt="" className="h-36 w-full object-cover" />
          ) : (
            <div className="flex h-36 items-center justify-center bg-brand-warm-gray">
              <Icon name="chefHat" size={38} color="var(--color-brand-navy)" />
            </div>
          )}
          <div className="p-4">
            <p className="onb-eyebrow">Your recipe preview</p>
            <h2 className="mt-2 break-words text-xl type-section-title text-brand-navy">
              {draft.title.trim() || "Your recipe name"}
            </h2>
            <p className="mt-1 text-[13px] type-meta text-text-secondary">
              {draft.servings > 0
                ? `${draft.servings} ${draft.servings === 1 ? "serving" : "servings"}`
                : "Add servings"}{" "}
              · {draft.ingredients.length}{" "}
              {draft.ingredients.length === 1 ? "ingredient" : "ingredients"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border-divider pt-4">
              {[
                ["Calories", `${nutrition.perServing.calories} kcal`],
                ["Protein", `${nutrition.perServing.protein} g`],
                ["Carbs", `${nutrition.perServing.carbs} g`],
                ["Fat", `${nutrition.perServing.fat} g`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-navy-soft p-2.5">
                  <p className="text-[12px] type-meta text-text-secondary">{k}</p>
                  <p className="mt-1 text-[15px] type-section-title tabular-nums text-brand-navy">
                    {v}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs type-meta text-text-secondary">
              Per serving · Updates as you add ingredients
            </p>
          </div>
        </aside>
      </form>
    </SheetFrame>
  );
}

const MACRO_FIELDS: { key: keyof Macros; label: string }[] = [
  { key: "calories", label: "Calories" },
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
];

function IngredientRow({
  ingredient: i,
  needsReview,
  defaultOpen,
  onChange,
  onRemove,
}: {
  ingredient: RecipeIngredient;
  needsReview: boolean;
  defaultOpen: boolean;
  onChange: (i: RecipeIngredient) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const amountId = useId();
  const unitId = useId();
  const { macros, source } = ingredientMacros(i);
  const units = unitsFor(i.refId);
  const setMacro = (k: keyof Macros, v: string) => {
    const n = Number(v);
    onChange({ ...i, macros: { ...macros, [k]: Number.isFinite(n) && n >= 0 ? n : 0 } });
  };
  return (
    <li className="py-3" data-testid="ingredient-row">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-onb-body type-item-title text-text-primary">{i.name}</p>
          <p className="text-onb-meta type-meta text-text-secondary">
            {source === "none"
              ? "No nutrition yet"
              : `${Math.round(macros.calories)} kcal · ${Math.round(macros.protein)}g protein · ${source === "typed" ? "your values" : "estimate"}`}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Remove ${i.name}`}
          onClick={onRemove}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-brand-warm-gray"
        >
          <Icon name="close" size={16} color="var(--color-text-secondary)" />
        </button>
      </div>
      {needsReview && (
        <p className="mt-1 inline-block rounded-full bg-primary-soft px-2.5 py-0.5 text-onb-meta type-meta text-primary">
          Check the amount and match
        </p>
      )}
      <div className="mt-2 grid grid-cols-[1fr_7rem] gap-2">
        <label htmlFor={amountId} className="sr-only">
          Amount of {i.name}
        </label>
        <input
          id={amountId}
          type="number"
          inputMode="decimal"
          min="0"
          value={i.quantity === null ? "" : String(i.quantity)}
          placeholder="Amount"
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange({
              ...i,
              quantity: e.target.value.trim() === "" || !Number.isFinite(n) ? null : Math.max(0, n),
            });
          }}
          className="panel h-12 w-full px-4 text-sm text-text-primary outline-none hover:border-text-neutral-400 focus:border-focus focus:ring-[3px] focus:ring-focus/15"
        />
        <label htmlFor={unitId} className="sr-only">
          Unit for {i.name}
        </label>
        <select
          id={unitId}
          value={units.includes(i.unit) ? i.unit : units[0]}
          onChange={(e) => onChange({ ...i, unit: e.target.value as IngredientUnit })}
          className="panel h-12 w-full px-3 text-sm text-text-primary outline-none hover:border-text-neutral-400 focus:border-focus focus:ring-[3px] focus:ring-focus/15"
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {UNIT_LABEL[u]}
            </option>
          ))}
        </select>
      </div>
      {source === "none" && (
        <div className="mt-2">
          <Notice>
            {i.refId
              ? "Add an amount to work out nutrition for this ingredient."
              : "We couldn’t find nutrition for this ingredient. Add your own values, or save without it."}
          </Notice>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="tap-44 relative mt-1 text-[13px] type-button text-primary"
      >
        {open ? "Hide nutrition" : source === "none" ? "Add nutrition" : "Edit nutrition"}
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-brand-warm-gray p-3">
          <p className="text-onb-meta type-meta text-text-secondary">
            For the amount above, not per 100 g.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MACRO_FIELDS.map((m) => (
              <AppTextField
                key={m.key}
                label={m.label}
                type="number"
                value={
                  source === "none" && i.macros === null
                    ? ""
                    : String(Math.round(macros[m.key] * 10) / 10)
                }
                onChange={(v) => setMacro(m.key, v)}
              />
            ))}
          </div>
          {i.macros !== null && i.refId && (
            <button
              type="button"
              onClick={() => onChange({ ...i, macros: null })}
              className="tap-44 relative self-start text-[13px] type-button text-primary"
            >
              Use the estimate again
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function AddIngredient({ onAdd }: { onAdd: (i: RecipeIngredient, own?: boolean) => void }) {
  const [q, setQ] = useState("");
  const found = searchFoods(q);
  const term = q.trim();
  const listId = useId();
  const add = (i: RecipeIngredient, own = false) => {
    onAdd(i, own);
    setQ("");
  };
  return (
    <div className="mt-4 border-t border-border-divider pt-4">
      <AppTextField
        label="Add an ingredient"
        value={q}
        onChange={setQ}
        placeholder="Search, e.g. chicken breast"
      />
      {term && (
        <ul
          id={listId}
          aria-label="Matching ingredients"
          className="panel mt-2 flex flex-col overflow-hidden"
        >
          {found.map((food) => (
            <li key={food.id} className="border-b border-border-divider last:border-b-0">
              <button
                type="button"
                onClick={() => add(newIngredient(food, food.name))}
                className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left hover:bg-brand-warm-gray"
              >
                <span className="min-w-0 flex-1 truncate text-onb-body text-text-primary">
                  {food.name}
                </span>
                <span className="shrink-0 text-onb-meta type-meta tabular-nums text-text-secondary">
                  {food.per100g.calories} kcal / 100 g
                </span>
              </button>
            </li>
          ))}
          {found.length === 0 && (
            <li className="px-4 py-3 text-onb-meta type-meta text-text-secondary">
              No match for “{term}”.
            </li>
          )}
          <li className="border-t border-border-divider">
            <button
              type="button"
              onClick={() => add(newIngredient(null, term), true)}
              className="flex min-h-12 w-full items-center gap-2 px-4 py-2 text-left text-onb-body type-button text-primary hover:bg-brand-warm-gray"
            >
              <Icon name="plusSign" size={16} color="var(--color-primary)" />
              Add “{term}” with my own nutrition
            </button>
          </li>
          <li className="border-t border-border-divider">
            <button
              type="button"
              onClick={() => add(newIngredient(null, term))}
              className="flex min-h-12 w-full items-center gap-2 px-4 py-2 text-left text-onb-body text-text-secondary hover:bg-brand-warm-gray"
            >
              Add “{term}” without nutrition
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
