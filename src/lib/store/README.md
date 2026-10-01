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
| `toast.*`, `<ToastViewport/>`                                                          | none                                                                                                    | UI.                                                                           |
| `useCached/invalidate/keyOf`                                                           | none                                                                                                    | Generic cache used by all of the above.                                       |

Other existing endpoints with no store wrapper (call `*Api` directly): age gate (`ageGateApi.verifyAgeGate`), password
reset / forgot (`authApi`), OAuth (`authApi.googleAuthUrl/appleAuthUrl/exchangeOAuthCode`), `profileApi`
preferences/export/delete account/experience-state, `eatOutApi.getRecommendations`, `discoveryApi.getAccountPrompt/
getFeatureGate/getAppEntry`, `trackingApi.getSnapshot/getFirstTime`.

## Deployed screens with NO endpoint (left out — routes show a "Not available" panel)

- AI assistant (`/assistant/**`, `/ai`, Melo FAB)
- Medication tracking (`/track/medication/**`, medication history, dose reminders, "Medication" dashboard card)
- Activity logging (`/track/activity*`, activity history) and weight logging (`/track/weight`) — tracking entries only carry meal/macros/water
- Shopping list (`/shopping-list`, "add ingredients to list")
- Recipe collections (`/you/saved/collections/:id`, collection create/rename)
- BMI / TDEE / calorie calculators (`/you/bmi|tdee|calories`) — pure maths exists in `@/lib/nutrition` if wanted later
- Recipe ratings, sleep tracking, "welcome back" lapse banner, in-app reminders/notification seed data
- Cook timers/"demo defaults" and every `demoDefaults` value

Pure helpers (no I/O, safe to use anywhere) live in `@/lib/nutrition`: dietary/goal/activity vocab, calorie/BMR maths,
portion scaling, budget/fit (`budgetFromSummary`, `fitFor`), `dietaryMatch`, email/password validation.
