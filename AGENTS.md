# HAR Picker — AGENTS.md

Agent instructions for HAR Picker (Vue 3 + Vite + TypeScript).
**Read this before writing code.**

---

## Overview

Desktop-first SPA to parse, filter, and compress HAR files for sharing with AI agents. 100% client-side — no server, no API calls.

### Key Principles

- Single-view SPA (no router)
- All processing in-browser (HAR never leaves)
- Light/dark mode via CSS (CSS custom properties + `prefers-color-scheme`)
- Classic legible UI (no glassmorphism, no gradient brand)
- Strict co-location: files that belong together live together

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3.5 + TypeScript 5.x |
| Build | Vite 7 |
| State | Pinia 3 (sync-only) |
| Styling | Scoped CSS + CSS custom properties |
| Tokenizer | `gpt-tokenizer` (cl100k_base) |

---

## Architecture: 3-Layer Data Flow

```
Component (Vue) → Helpers (pure TS) → Store (Pinia, sync-only)
```

This is the **most important rule** in this project. Every operation follows this flow. Never skip layers.

### Component Layer

- UI rendering + user interaction
- Calls helpers, updates store
- Handles events (paste, click, toggle)
- NO processing logic
- NO direct store mutations from template (always through component methods)

### Helper Layer

- Pure TypeScript functions (no Vue dependency)
- Data transformation, parsing, compression, token counting
- Loading/error state management where applicable
- NO Vue reactivity
- NO store access
- Every helper has a single responsibility

### Store Layer

- Pinia store(s), sync operations only
- Holds all application state
- Computed properties for derived data (compressed output, stats)
- NO async operations
- NO processing logic
- NO API calls

---

## Co-location Rules

Co-location is the **second most important rule**.

### File Placement

A file lives as close as possible to where it is used:

```
src/
├── main.ts                         # App entry
├── App.vue                         # Root component
├── types/
│   └── Har.ts                      # HAR types (used by multiple layers)
├── helpers/
│   ├── parser.helpers.ts           # HAR parse + validate
│   ├── compressor.helpers.ts       # Strip + serialize
│   ├── tokenizer.helpers.ts        # Token counting
│   └── inferType.helpers.ts        # MIME → resource category
├── stores/
│   └── harStore.ts                 # Single store (small app)
├── components/
│   ├── PasteDropZone.vue           # DnD / paste
│   ├── Toolbar.vue                 # Filters, presets
│   ├── EntryList.vue               # Entry list (virtualized)
│   ├── EntryItem.vue               # Single entry row + expand
│   └── PreviewPanel.vue            # Stats + copy
└── utils/
    └── format.ts                   # Generic formatters
```

### What NOT to do

- Do NOT create a `views/` directory (single view)
- Do NOT create `components/ui/` directory (no shared UI lib)
- Do NOT create a `router/` directory (no routing)
- Do NOT create `docs/` or `composables/` directories
- Do NOT separate components by concern (keep entry list + item together)

---

## Code Conventions

### TypeScript

- Strict mode
- **No `any`** — use `unknown` + narrowing
- Explicit return types on functions
- Export types from `types/Har.ts`

### File Naming

```
Components:  PascalCase.vue       (EntryItem.vue)
Helpers:     camelCase.helpers.ts (parser.helpers.ts)
Store:       camelCaseStore.ts    (harStore.ts)
Types:       PascalCase.ts        (Har.ts)
Utils:       camelCase.ts         (format.ts)
```

### Formatting

- Single quotes for strings
- Semicolons: yes
- Indentation: 2 spaces
- Line length: 100 characters (soft)
- Trailing commas in multiline

### CSS Conventions

- Scoped `<style scoped>` on every component
- CSS custom properties for light/dark mode (defined in `App.vue`)
- Semantic class names
- No CSS framework (no Tailwind, no Bootstrap)
- Mobile responsive via media queries where practical

---

## Light/Dark Mode

Define color tokens in `App.vue`:

```css
:root {
  --color-bg: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-text: #1A1A1A;
  --color-text-muted: #6B6B6B;
  --color-border: #E5E5E5;
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-danger: #DC2626;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.08);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #111111;
    --color-surface: #1C1C1C;
    --color-text: #E5E5E5;
    --color-text-muted: #9C9C9C;
    --color-border: #333333;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 8px rgba(0,0,0,0.4);
  }
}
```

---

## Hard Rules

1. **3-layer flow**: Component → Helpers → Store. Never skip layers.
2. **Co-location**: Files live as close as possible to where they are used.
3. **Sync stores only**: No async ops in Pinia. All processing in helpers.
4. **No `any`**: Strict TypeScript. Use `unknown` + narrowing.
6. **No auto-commit**: Never create or push commits unless explicitly requested.
7. **No hardcoded colors**: Use CSS custom properties from `App.vue`.
8. **No code sharing with palla** — this is a separate codebase with its own design.
9. **100% client-side**: No server, no API calls, no backend.
