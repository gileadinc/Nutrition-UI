# ForkThis! — Design System

## Color System

### 3-Tier Variable Architecture

Colors use a 3-level token system: **Primitives → Semantic → Component**. This
keeps theming consistent and makes dark mode or white-label reskinning possible
by changing only the Primitives layer.

```
Primitives   raw values          --green-500, --warm-orange-500, --ink-800
   │         (never used directly)
   ▼
Semantic     intent              --text-primary, --background-brand, --action-primary-default
   │         (reference Primitives)
   ▼
Component    per-component        --button-primary-bg, --input-border, --card-bg
             (reference Semantic)
```

All tokens live in [`src/styles/tokens.css`](src/styles/tokens.css), imported at
the top of [`src/app/globals.css`](src/app/globals.css). Values are OKLCH,
sampled from the ForkThis! auth + onboarding designs.

---

### Primitives (53 variables)

| Group | Variables | Notes |
| --- | --- | --- |
| **Green scale** | `--green-50` … `--green-900` | Brand teal-emerald. `--green-500` = `#12A9A0` primary button fill |
| **Warm Orange scale** | `--warm-orange-50` … `--warm-orange-900` | Accent. `--warm-orange-500` = `#E8663A` heading / link orange |
| **Ink scale** | `--ink-50` … `--ink-900` | Navy-tinted near-black. `--ink-700` body text, `--ink-800` labels |
| **Neutral** | `--neutral-ink`, `--neutral-50` … `--neutral-900`, `--white`, `--black` | Pure greys where no ink tint is wanted |
| **Warm surfaces** | `--surface-warm` (`#FFF8F2`), `--surface-base` (`#FBFBFB`), `--surface-elevated` (`#FFFFFF`), `--surface-warm-subtle` (`#FCE9DC`) | Page + panel grounds |
| **Status hues** | `--status-success` / `-subtle`, `--status-warning` / `-subtle`, `--status-error` / `-subtle`, `--status-info` / `-subtle` | Raw feedback hues |

---

### Semantic Tokens (47 variables)

| Group | Variables |
| --- | --- |
| **Text** | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-disabled`, `--text-on-dark`, `--text-on-primary`, `--text-on-secondary`, `--text-link`, `--text-link-hover`, `--text-inverse`, `--text-brand` |
| **Background** | `--background-base`, `--background-warm`, `--background-elevated`, `--background-subtle`, `--background-brand`, `--background-brand-hover`, `--background-secondary`, `--background-disabled`, `--background-highlight` |
| **Border** | `--border-default`, `--border-subtle`, `--border-active`, `--border-secondary-active`, `--border-strong`, `--border-focus`, `--border-error` |
| **Action** | `--action-primary-default` / `-hover` / `-pressed` / `-disabled`, `--action-secondary-default` / `-hover`, `--action-dark-default` / `-hover` |
| **Semantic (feedback)** | `--semantic-success` / `-subtle`, `--semantic-warning` / `-subtle`, `--semantic-error` / `-subtle`, `--semantic-info` / `-subtle`, `--semantic-neutral` |

---

### Component Tokens (20 variables)

| Group | Variables |
| --- | --- |
| **Button** | `--button-primary-bg` / `-text` / `-border`, `--button-secondary-bg` / `-text`, `--button-dark-bg` / `-text` |
| **Input** | `--input-bg`, `--input-border`, `--input-text`, `--input-placeholder`, `--input-focus-border`, `--input-error-border` |
| **Card** | `--card-bg`, `--card-border` |
| **Navigation** | `--nav-active`, `--nav-inactive` |
| **AI** | `--ai-accent`, `--ai-background` |
| **Tab** | `--tab-active`, `--tab-inactive` |

---

### Usage Rules

- **Never use raw hex values** — always reference a variable.
- **Never reference Primitives** (`--green-500`, `--ink-800`, …) outside
  `tokens.css`. Components consume Semantic or Component tokens only.
- Semantic tokens reference Primitives (e.g. `--action-primary-default` → `--green-500`).
- Component tokens reference Semantic tokens for maximum flexibility.
- **Status colors** (Success / Warning / Error / Info) are reserved for feedback —
  don't use them decoratively.

---

### How it connects to the component libraries

The shadcn / base-ui components in [`src/components/ui/`](src/components/ui/)
speak a fixed contract (`--primary`, `--background`, `--border`, `--ring`, …).
A **bridge block** in `globals.css` maps that contract onto the Semantic layer,
so those components inherit the ForkThis! palette automatically. Never put raw
values in the bridge — reskin at the Primitives layer.

Selected palette utilities are also exposed to Tailwind via `@theme` in
`globals.css`: `bg-brand`, `text-brand-foreground`, `text-accent-brand`,
`bg-success` / `text-success` (+ `-subtle`), `warning`, `error`, `info`,
`bg-surface-warm` / `-base` / `-elevated`.

CSS Modules (layout files, `AppShell`, `FormErrorMessage`, …) reference the
Semantic / Component tokens directly, e.g. `color: var(--text-secondary)`.

---

### Dark mode

Not implemented yet (light-only). When added: override **only** the Primitives
block for `.dark` in `tokens.css`. The Semantic tier, Component tier, and the
`globals.css` bridge all follow automatically — no other file changes.
