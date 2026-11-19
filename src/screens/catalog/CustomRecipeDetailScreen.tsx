"use client";

import {
  CenteredShell,
  DetailFrame,
  DetailSection,
  Disclosure,
  IngredientsPanel,
  MacroDonut,
  MedicalNote,
  NutritionLine,
  PrimaryButton,
  SecondaryButton,
  StatePanel,
  SurgeryNote,
  usePortionSheet,
  useRecoveringFromSurgery,
} from "@/components";
import { Link, useNavigate, useParams } from "@/lib/nav";
import { toast, useRequireAccount, useShoppingList } from "@/lib/store";
import {
  UNIT_LABEL,
  ingredientMacros,
  recipeNutrition,
  useCustomRecipe,
  type RecipeIngredient,
} from "@/lib/store/customRecipes";

const line = (i: RecipeIngredient) => {
  const qty =
    i.quantity === null ? "" : `${Math.round(i.quantity * 100) / 100} ${UNIT_LABEL[i.unit]} `;
  const none = ingredientMacros(i).source === "none";
  return `${qty}${i.name}${none ? " · no nutrition" : ""}`;
};

/** `/recipes/mine/:id`: a recipe the person built themselves. */
export function CustomRecipeDetailScreen() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recipe = useCustomRecipe(id);
  const requireAccount = useRequireAccount();
  const shopping = useShoppingList();
  const surgery = useRecoveringFromSurgery();
  const portion = usePortionSheet({ context: "log" });

  if (!recipe)
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

  const n = recipeNutrition(recipe);
  const servingsText = `${recipe.servings} ${recipe.servings === 1 ? "serving" : "servings"}`;
  return (
    <>
      <DetailFrame
        image={recipe.photo ?? ""}
        badge="My recipe"
        title={recipe.title}
        subtitle={`${servingsText} · ${recipe.ingredients.length} ${recipe.ingredients.length === 1 ? "ingredient" : "ingredients"}`}
        fallbackRoute="/recipes"
        footer={
          <>
            <SecondaryButton
              label="Edit"
              className="text-onb-body"
              onPress={() => navigate(`/recipes/mine/${recipe.id}/edit`)}
            />
            <PrimaryButton
              label="Log this meal"
              onPress={() =>
                portion.open({
                  id: recipe.id,
                  title: recipe.title,
                  subtitle: servingsText,
                  calories: n.perServing.calories,
                  protein: n.perServing.protein,
                  carbs: n.perServing.carbs,
                  fat: n.perServing.fat,
                  sourceType: "custom",
                })
              }
            />
          </>
        }
      >
        <NutritionLine {...n.perServing} label="Nutrition per serving" />
        {n.incomplete > 0 && (
          <p role="status" className="panel p-3 text-onb-body text-text-primary">
            {n.incomplete} {n.incomplete === 1 ? "ingredient has" : "ingredients have"} no
            nutrition, so the figures above leave {n.incomplete === 1 ? "it" : "them"} out.{" "}
            <Link
              to={`/recipes/mine/${recipe.id}/edit`}
              className="type-button text-primary underline-offset-2 hover:underline"
            >
              Add it
            </Link>
          </p>
        )}
        <IngredientsPanel
          items={recipe.ingredients.map(line)}
          action={
            <SecondaryButton
              label="Add to shopping list"
              className="h-11 text-onb-body"
              onPress={() => {
                if (!requireAccount("The shopping list")) return;
                shopping.add(
                  recipe.ingredients.map((i) => line(i).replace(" · no nutrition", "")),
                  recipe.title,
                );
                toast.success(`${recipe.ingredients.length} ingredients added`, {
                  body: `From ${recipe.title}.`,
                  action: { label: "Open list", run: () => navigate("/shopping-list") },
                });
              }}
            />
          }
        />
        {surgery && (
          <SurgeryNote>
            Follow your care team&apos;s guidance on how much to eat, and log the portion you
            actually have.
          </SurgeryNote>
        )}
        <DetailSection title="Serving size">
          <p className="text-onb-body text-text-secondary">
            Makes {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}
            {n.totalGrams === null
              ? ". Add a finished weight when you edit it to log by grams."
              : `, about ${Math.round(n.totalGrams / recipe.servings)} g each. You can log by servings or by grams.`}
          </p>
        </DetailSection>
        <Disclosure title="Full nutrition" summary="Macro split">
          <MacroDonut
            macros={{
              protein: n.perServing.protein,
              carbs: n.perServing.carbs,
              fat: n.perServing.fat,
            }}
            total={n.perServing.calories}
            variant="detail"
          />
        </Disclosure>
        <MedicalNote />
      </DetailFrame>
      {portion.sheet}
    </>
  );
}
