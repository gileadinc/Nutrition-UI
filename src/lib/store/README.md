# `@/lib/store` — app client state

Replaces the deployed app's local mock store (`store-*.js`, `forkthis_app_state` in localStorage). Everything here is
backed by the real API (`@/lib/api`, endpoints unchanged) or by the real session in `@/lib/auth`. There is **no demo
data**: no seeded track days, no sample recipes/hacks, no demo form defaults.

Import from `@/lib/store`. All hooks are client-only (`"use client"`).

## Capability -> endpoint

| Store capability                                                                       | API                                                                                                     | Notes                                                                         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `useAppSession()` / `getAppSession()` (`signedIn` / `guest` / `anonymous`)             | `@/lib/auth` session (localStorage tokens) + guest session id                                           | `ready` is false until hydrated.                                              |
| `startGuestSession()`                                                                  | `POST /api/auth/guest/session`                                                                          | "Continue as guest".                                                          |
| `completeSignIn(res)`                                                                  | tokens from `POST /api/auth/signin`, `/signup` flow, `/oauth/exchange` + `POST /api/auth/guest/migrate` | Call after any sign-in. Returns false for challenges.                         |
| `signOut()`                                                                            | `POST /api/auth/signout`                                                                                | Clears local session, guest id, caches.                                       |
| `useRequireAccount()` + `GuestGateProvider`                                            | none (UI gate)                                                                                          | Guests get the "needs an account" sheet.                                      |
| `useProfile()` / `update()`                                                            | signed in: `GET/PATCH /api/profile/me`; guest: onboarding session                                       | Middle name has no API field (first = `givenName`, last = `familyName`).      |
| `QuestionnaireDraft` helpers (`loadDraft`, `saveDraft`, `clearDraft`)                  | none (localStorage `forkthis_onboarding_draft`)                                                         | In-progress answers only.                                                     |
| `submitQuestionnaire()`, `getOrCreateOnboardingSession()`, `syncOnboardingToProfile()` | `POST/GET/PATCH /api/onboarding/sessions`, `PATCH /api/profile/me`                                      |                                                                               |
| `useHome()`                                                                            | signed in: `GET /api/discovery/home`; guest: `GET /api/discovery/guest-home`                            |                                                                               |
| `useRecipes/useRecipe/useSimilarRecipes`                                               | `GET /api/recipes`, `/:id`, `/:id/similar`                                                              |                                                                               |
| `useFastHacks/useFastHack/useSimilarFastHacks`                                         | `GET /api/eat-out/fast-hacks`, `/:id`, `/:id/similar`                                                   |                                                                               |
| `useRestaurants/useRestaurant/useMenuItem`                                             | `GET /api/eat-out/restaurants`, `/menu-items/:id`                                                       |                                                                               |
| `useDiscoveryFilters()`                                                                | `GET /api/discovery/filters`                                                                            |                                                                               |
| Search                                                                                 | `discoveryApi.searchDiscovery` (call directly)                                                          | `useRecentSearches()` is device-local.                                        |
| `useDailySummary/useDayBudget`                                                         | signed in: `GET /api/tracking/me/daily-summary`; guest: computed from guest entries                     | `useDayBudget` feeds `fitFor()` ("Fits today").                               |
| `useEntries`, `useTrackingActions()` (`log/update/remove/addWater`)                    | `/api/tracking/me/entries*` (signed in), `/api/tracking/guest/entries*` (guest)                         | Deployed UX gates tracking for guests via `useRequireAccount`.                |
| `useMomentum`, `useTrackingRecommendations`                                            | `GET /api/tracking/me/momentum`, `/recommendations`                                                     |                                                                               |
| `useSaved()` (`isSaved`, `toggle`)                                                     | `/api/saved-items/me`                                                                                   | Signed in only; wraps `useSavedItems`. Types: `recipe`, `fast_hack`, `order`. |
| `useNotifications()`                                                                   | `/api/profile/me/notifications*`                                                                        |                                                                               |
| `useShoppingList()` (`items`, `add`, `toggle`, `clearChecked`, `clearAll`)                | `/api/shopping-lists/me*` (list, create, items add/update, clear-checked, `recipes/{id}`, delete)        | Signed in only. One default list "Shopping list" (first list, created on first write); optimistic; old `forkthis.shoppingList` localStorage items are migrated once then removed. `add(..., {recipeId, whole})` uses `POST .../recipes/{id}`. |
| `useMedications({history?})`, `doseStatus` (`meds`, `history`, `add`, `update`, `remove`, `take`, `untake`, `reminders`, `setReminder`) | `/api/medication-schedules/me*` (CRUD, `GET .../reminders?date=`, `POST .../{id}/doses`), `DELETE /api/tracking/me/entries/{id}` for Undo | Signed in only. Daily schedule with one time (`timesOfDay[0]`, API wants `HH:mm`, UI shows `9:00 PM`). Today/history = reminders per date (history: last 14 days, opt-in). Reminder toggles = `remindersEnabled`. No snooze endpoint (dropped). |
| `toast.*`, `<ToastViewport/>`                                                          | none                                                                                                    | UI.                                                                           |
| `useCached/invalidate/keyOf`                                                           | none                                                                                                    | Generic cache used by all of the above.                                       |

Other existing endpoints with no store wrapper (call `*Api` directly): age gate (`ageGateApi.verifyAgeGate`), password
reset / forgot (`authApi`), OAuth (`authApi.googleAuthUrl/appleAuthUrl/exchangeOAuthCode`), `profileApi`
preferences/export/delete account/experience-state, `eatOutApi.getRecommendations`, `discoveryApi.getAccountPrompt/
getFeatureGate/getAppEntry`, `trackingApi.getSnapshot/getFirstTime`.

## Device-local features (no endpoint; browser localStorage, not synced; shopping list and medication moved to the API)

| Store | Key | Notes |
|---|---|---|
| `useActivity()` (`src/lib/store/activity.ts`) | `forkthis.activity` | `/track/activity*`. Entries `{id,name,minutes,calories,loggedAt}`, today totals, 30 min goal, recents; writes need an account. Shown in the Track dashboard "Also today". |
| `useWeight()` (`src/lib/store/weight.ts`) | `forkthis.weight` | `/track/weight`. One `{date,pounds}` reading per day (lb only); writes need an account. Shown in the Track dashboard "Also today". Insights does not chart activity/weight. |
| Melo popup (`src/lib/melo`, `src/components/Melo`) | none (in-memory chat) | **Not an AI/LLM and there is no assistant endpoint.** A local rule-based engine (dish, fits, progress, protein, water, search, swap, fallback) answers from the real day budget (`useDayBudget`), tracked days (`useTrackDays`) and the real catalogue (`useFastHacks`/`useRecipes`). Open on all `(app)` routes via `MeloLayer` in `AppShell`. Chat history lives in memory only. Guests can chat; nothing is logged from chat. |

## Deployed screens with NO endpoint (left out — routes show a "Not available" panel)

- AI assistant full pages (`/assistant/**`, `/ai`). The Melo popup (FAB + chat panel) exists (see the table above)
- Recipe collections (`/you/saved/collections/:id`, collection create/rename)
- BMI / TDEE / calorie calculators (`/you/bmi|tdee|calories`) — pure maths exists in `@/lib/nutrition` if wanted later
- Recipe ratings, sleep tracking, "welcome back" lapse banner, in-app reminders/notification seed data
- Cook timers/"demo defaults" and every `demoDefaults` value

Pure helpers (no I/O, safe to use anywhere) live in `@/lib/nutrition`: dietary/goal/activity vocab, calorie/BMR maths,
portion scaling, budget/fit (`budgetFromSummary`, `fitFor`), `dietaryMatch`, email/password validation.
