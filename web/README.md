# Web (foundation)

Next.js (App Router, TypeScript) foundation for the Nutrition web app. This is scaffolding only —
placeholder content, structure, and reusable components. No final visual design yet.

## Requirements

- Node.js 20+
- npm

## Local setup

```bash
cd web
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
web/
  src/
    app/                 App Router routes (layout, pages)
    components/          Reusable UI components (Button, TextInput, Card, Container,
                          LoadingIndicator, FormErrorMessage, AppShell)
  vitest.config.ts        Test runner config
  eslint.config.mjs        Lint config
  vercel.json               Vercel build/deploy config
```

Each component lives in its own folder with the component, its CSS module, an index barrel
export, and (where applicable) a test file, e.g. `src/components/Button/`.

## Deployment (Vercel)

1. Import this repository into Vercel, setting the **root directory to `web`**.
2. Vercel auto-detects the Next.js framework; `vercel.json` in this folder pins the build/dev/install commands explicitly.
3. Every branch/PR gets its own preview deployment automatically — share that URL for internal review.
4. `main` (or a `staging` branch, if configured in Vercel's Git settings) maps to the production/staging deployment. Until a real `staging` branch is introduced, treat `main` deployments as the shared staging environment — do not assume it is client-facing production.
5. Add any required environment variables (see `.env.example`) in the Vercel project settings for each environment (Production/Preview/Development).

## Development identity

CI/CD and Vercel activity for this project should use the assigned Universal Perk developer
identity/account where required by the pipeline.
