# Nutrition-II

Next.js (App Router, TypeScript) foundation for the Nutrition web app. This is scaffolding only —
placeholder content, structure, and reusable components. No final visual design yet.

## Requirements

- Node.js 20+
- npm

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and fill in values as needed:

```bash
cp .env.example .env.local
```

## Scripts

| Command                | Purpose                          |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start the local dev server       |
| `npm run build`        | Production build                 |
| `npm run start`        | Run the production build locally |
| `npm run lint`         | ESLint checks                    |
| `npm run format`       | Format files with Prettier       |
| `npm run format:check` | Check formatting without writing |
| `npm run test`         | Run the Vitest suite once        |
| `npm run test:watch`   | Run Vitest in watch mode         |

## Project structure

```
src/
  app/
    (marketing)/        Public pages: home ("/"), about ("/about")
    (auth)/              Auth pages: login ("/login"), register ("/register")
    (app)/                Authenticated app shell: dashboard ("/dashboard")
    layout.tsx             Root layout — wraps every route in AppShell
  components/
    ui/                  shadcn/ui primitives, managed by the shadcn CLI (see below)
    <Name>/              Hand-written composite components (see below)
  lib/
    api/                 API client, error type, and typed endpoint functions (see below)
    hooks/               Reusable React hooks (useMediaQuery, useAsync)
    utils/               Framework-agnostic helpers (e.g. cn, getInitials)
    types/               Shared TypeScript types
    constants/           Shared constants (routes, breakpoints)
vitest.config.ts        Test runner config
eslint.config.mjs        Lint config
components.json          shadcn/ui CLI config (style, aliases, icon library)
postcss.config.mjs       Tailwind CSS v4 PostCSS plugin
vercel.json               Vercel build/deploy config
```

The folders in parentheses under `app/` — `(marketing)`, `(auth)`, `(app)` — are Next.js
[route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups): they
organize routes by section without affecting the URL, and each can carry its own `layout.tsx`.

### Components

UI is built on [shadcn/ui](https://ui.shadcn.com/) (the `base-nova` style, on top of
[Base UI](https://base-ui.com/) primitives + `class-variance-authority`) and
[Tailwind CSS v4](https://tailwindcss.com/). Generated primitives live in `src/components/ui/`
(e.g. `button.tsx`, `card.tsx`, `dialog.tsx`) and are managed by the shadcn CLI rather than
hand-edited — add another one with:

```bash
npx shadcn@latest add <component>
```

A small set of composite components without a direct shadcn equivalent are hand-written in
`src/components/<Name>/`:

| Component          | Purpose                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `AppShell`         | Global header/nav, main, footer used by the root layout                                     |
| `Container`        | Max-width content wrapper with responsive padding                                           |
| `TextField`        | Composes `ui/input` + `ui/label` with label/error wiring                                    |
| `UserAvatar`       | Composes `ui/avatar` with initials-fallback logic, `sm`/`md`/`lg` sizes                     |
| `FormErrorMessage` | Inline form error text with alert role                                                      |
| `ErrorState`       | Title/description/action placeholder for error views (used by `error.tsx`, `not-found.tsx`) |

Everything else (buttons, cards, badges, checkboxes, tabs, accordions, dialogs, selects, empty
states, avatars, separators) is used directly from `src/components/ui/`. Toasts use
[sonner](https://sonner.emilkowal.ski/) — call `toast(...)` / `toast.success(...)` /
`toast.error(...)` from `"sonner"`; a single `<Toaster />` (`src/components/ui/sonner.tsx`) is
mounted once in the root layout. There is no custom toast context/provider.

Components that need interactivity (state, effects, refs) are marked `"use client"`, since the
App Router treats every component as a Server Component by default.

## API layer

`src/lib/api/` is the shared foundation for talking to a backend. It's intentionally
backend-agnostic right now — no real API exists yet — but the shape is meant to hold once one
does.

| File                 | Purpose                                                                                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client.ts`          | `apiClient.get/post/put/patch/delete` — a `fetch` wrapper that prefixes `NEXT_PUBLIC_API_BASE_URL`, sends/parses JSON, applies a request timeout (default 15s via `AbortController`), and unwraps the `{ success, data }` / `{ success, error }` envelope described below |
| `ApiError.ts`        | `ApiError` — thrown on every failure. Has a `kind` (`"network"` \| `"timeout"` \| `"parse"` \| `"api"`), an optional `status`/`code`/`details`, and a human-readable `message`                                                                                            |
| `types.ts`           | The assumed response envelope: `{ success: true, data }` or `{ success: false, error: { code, message, details? } }`. Adjust once the real API contract is known                                                                                                          |
| `getErrorMessage.ts` | Converts any thrown value (`ApiError`, `Error`, string, or unknown) into a safe, user-facing string — this is what UI code should show, never `error.message` directly                                                                                                    |
| `endpoints/`         | Typed request functions grouped by domain, e.g. `endpoints/auth.ts` exports `login()`. Pages/components call these, never `apiClient` directly, so request/response shapes stay typed and centralized                                                                     |

**Calling convention:** endpoint functions throw `ApiError` on failure and resolve with the
already-unwrapped `data` on success — no `try/catch` boilerplate needed if you use `useAsync`
(`src/lib/hooks/useAsync.ts`), which wraps any async function and exposes `{ status, data, error,
isLoading, execute, reset }` to a component. `error` is already a display-ready string via
`getErrorMessage`. See `src/app/(auth)/login/page.tsx` for a full example: it calls
`authApi.login` through `useAsync`, renders `error` in a `FormErrorMessage`, and shows a success
toast via `toast.success(...)` (from `"sonner"`).

**Error UI conventions:**

- Inline field/form errors → `FormErrorMessage`
- A whole section/page failed to load → `ErrorState`
- A background action succeeded or failed (not tied to a specific field) → `toast(message)` / `toast.success(message)` / `toast.error(message)` (from `"sonner"`)
- Uncaught render errors → handled automatically by `src/app/error.tsx` (per-segment) and `src/app/global-error.tsx` (root); unmatched routes render `src/app/not-found.tsx`

## Deployment (Vercel)

1. Import this repository into Vercel — the project root is the repository root.
2. Vercel auto-detects the Next.js framework; `vercel.json` pins the build/dev/install commands explicitly.
3. Every branch/PR gets its own preview deployment automatically — share that URL for internal review.
4. `main` (or a `staging` branch, if configured in Vercel's Git settings) maps to the production/staging deployment. Until a real `staging` branch is introduced, treat `main` deployments as the shared staging environment — do not assume it is client-facing production.
5. Add any required environment variables (see `.env.example`) in the Vercel project settings for each environment (Production/Preview/Development).

## Development identity

CI/CD and Vercel activity for this project should use the assigned Universal Perk developer
identity/account where required by the pipeline.
