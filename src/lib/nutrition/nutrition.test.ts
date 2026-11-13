import { describe, expect, it } from "vitest";
import { ageFromDob, calorieTarget, macroGrams, tdee } from "./onboarding";

const base = { weightKg: 75, heightCm: 170, age: 33, activity: "lightlyActive" as const };

describe("nutrition", () => {
  it("computes TDEE and applies the goal delta", () => {
    const maintain = tdee(base);
    expect(maintain).toBe(Math.round((10 * 75 + 6.25 * 170 - 5 * 33 - 78) * 1.375));
    expect(calorieTarget({ ...base, goal: "lose" })).toBe((maintain as number) - 500);
  });

  it("never recommends below 1000 kcal", () => {
    expect(
      calorieTarget({ weightKg: 40, heightCm: 140, age: 80, activity: "mostlyInactive", goal: "lose" }),
    ).toBeNull();
  });

  it("splits macros 30/40/30", () => {
    expect(macroGrams(2000)).toEqual({ protein: 150, carbs: 200, fat: 67 });
  });

  it("derives age and rejects impossible dates", () => {
    expect(ageFromDob(3, 15, 1993, new Date(2026, 10, 10))).toBe(33);
    expect(ageFromDob(2, 30, 1993)).toBeNull();
  });
});
