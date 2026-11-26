# 钱书 (Money Book) — Project Context

> Generated 2026-09-29. This file provides instructional context for future interactions with this codebase.

## Project Overview

**钱书 (Money Book)** is a **local-first, zero-backend** personal bookkeeping PWA (Progressive Web App). All user data is stored in the browser's IndexedDB via Dexie. There is no server, authentication service, or network dependency for core functionality — everything runs entirely in the browser.

- **端到端加密/PIN 保护:** An app-level unlock layer (6-digit PIN, optionally Face ID / Touch ID / Windows Hello via WebAuthn) prevents access to financial data when the device is in someone else's hands.
- **App 名称:** "钱书" (display name in PWA manifest, HTML title).
- **UI Language:** Chinese (zh-CN). Code comments/docs are in Chinese.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Vue 3 (`^3.4`) — Composition API + `<script setup>` | Any new component should follow this pattern |
| Language | TypeScript (`^5.3`), `strict: true` | Type checking via `vue-tsc` |
| Build | Vite (`^5.1`) | Alias `@` → `./src` |
| Styling | UnoCSS (`^0.58`) | Utility-first CSS; `uno.css` imported in `main.ts` |
| State | Pinia (`^2.1`) | Setup-store style (`defineStore('x', () => {...})`) |
| DB | Dexie (`^3.2`) + `@vueuse/core` `liveQuery` | IndexedDB wrapper |
| Routing | vue-router (`^4.3`) | `createWebHistory` |
| Charts | ECharts via `vue-echarts` (`^7.0`) | Tree-shaken imports in `utils/echarts-setup.ts` |
| Icons | `@iconify/vue` + `@iconify-json/twemoji` | Local emoji bundle (see below) |
| PWA | `vite-plugin-pwa` (`^0.19`) | `registerType: 'autoUpdate'`, manifest in `vite.config.ts` |
| Node | `.nvmrc` = `20` | ES modules (`"type": "module"`) |

## Commands

```bash
npm run dev                 # Start Vite dev server (host on network, --host)
npm run build               # Type-check (vue-tsc --noEmit) then production build
npm run preview             # Preview production build
npm run generate-twemoji    # Regenerate src/utils/twemoji-bundle.ts from iconify data
```

There is **no test runner / lint script configured** in `package.json`. Code quality is enforced via `tsc` type-checks included in the build. If asked to run tests, note that none exist.

## Key Commands Notes

- `npm run build` runs `vue-tsc --noEmit && vite build` — type errors will fail the build. Run this after any code changes.

## Architecture

### Entry Flow
`src/main.ts` → creates Vue app, installs Pinia + router, mounts, requests `navigator.storage.persist()`, and runs `seedData()` (idempotent — only seeds if tables are empty).

`src/App.vue` is the **unlock controller**: renders a `PinDialog` lock layer until `uiStore.unlocked === true`, then renders the layout. It also manages theme (light/dark/system), font-size scaling (`.font-{xs|sm|md|lg|xl}` classes on `<html>`), and re-locks on `visibilitychange` (when app goes to background).

### Routing (`src/router/index.ts`)
`/` redirects to `/booking`. Pages:
- `/booking` → `BookingPage.vue` (default landing — quick book entry)
- `/transactions` → `TransactionsPage.vue`
- `/accounts` → `AccountsPage.vue`
- `/stats` → `StatsPage.vue` (ECharts visualizations)
- `/settings` → `SettingsPage.vue`

Pages live under `src/pages/<feature>/`, components under `src/components/<feature>/`. Layout components in `src/components/layout/` (`MobileLayout.vue`, `TabBar.vue`).

### Data Access Pattern
Dexie `liveQuery` is wrapped by the reusable composable `src/composables/useLiveQuery.ts`, which exposes reactive queries as Vue `ref`s. Stores use this to make IndexedDB reactive.

Stores (`src/stores/`):
- **`accountStore`** — accounts list + `totalBalance` computed
- **`categoryStore`** — categories with parent/child hierarchy
- **`transactionStore`** — CRUD; maintains an internal `version` counter bumped on every mutation; `getByDateRange` uses `liveQuery`
- **`quickTemplateStore`** — quick-book bubble templates
- **`uiStore`** — non-DB UI state (theme, fontSize, `unlocked`, booking mode/amount, tab-bar save bridge)

## Database Schema (Dexie — `src/db/index.ts`)

DB name: `moneybook`, currently at **version 5**. When changing schema, **bump the version and provide an `.upgrade()` migration**.

| Table | Key/indexes | Notes |
|-------|------------|-------|
| `accounts` | `++id, name` | `balance` stored in **分 (cents)** |
| `categories` | `++id, type, parentId` | Hierarchical: `parentId === null` = parent |
| `transactions` | `++id, type, date, categoryId, [date+id]` | `[date+id]` compound index for cursor pagination |
| `recurringRules` | `++id, enabled, dayOfMonth` | Recurring rules |
| `tags` | `++id, &name` | Unique name; synced from transaction tags |
| `quickTemplates` | `++id, type, sort` | Quick-book templates |

Seed data (`src/db/seed.ts`): default accounts (银行卡/支付宝/微信/现金) and hierarchical expense/income categories. Only runs when the relevant table is empty.

## Critical Conventions & Gotchas

- **货币单位 = 分 (cents / fen).** Amounts are stored as integers in 分. Use `formatCurrency()` and `formatShortCurrency()` from `src/utils/format.ts` for display. Example: `128000` → `"¥1,280.00"`.
- **Dates are `YYYY-MM-DD` strings**, times `HH:MM`. See `toDateString`, `parseDateStr`, `formatDate`, `formatTimeLabel` in `src/utils/format.ts`.
- **Transaction `type`:** `'expense' | 'income' | 'transfer'` (defined in `src/types/index.ts`). Cards, categories, and templates use the same union.
- **Setup-store Pinia** style — use `defineStore('name', () => {...})` returning an object (no Options API).
- **Template syntax:** `<script setup lang="ts">` with explicit type imports. Component names use `PascalCase.vue`.
- **Path alias:** use `@/...` (maps to `src/`) — never deep relative imports.
- **Icons:** emoji are mapped to locally-bundled twemoji SVGs via `src/utils/twemoji-bundle.ts`. **This file is auto-generated by `npm run generate-twemoji` — do not hand-edit.** Icon names/types come from `script/generate-twemoji.cjs`'s `emojiList`; add new icons there and regenerate.
- **ECharts** is globally (tree-shaken) registered once in `src/utils/echarts-setup.ts` (Bar, Pie, Line + grid/tooltip/legend/markline + Canvas). Import this side-effect (done in `main.ts`) before using charts.
- **No backend:** all persistence is IndexedDB + localStorage. Data export/import/destroy handled in `src/utils/export.ts` (`exportData`, `importData`, `destroyAllData`). Note: `destroyAllData()` clears DB + caches + service workers but **not** localStorage (PIN/biometric flags persist independently, per `docs/security_design.md`).
- **PWA install:** configured in `vite.config.ts`. Assets referenced in the manifest (favicons) must exist in `public/`.

## Security & App Unlock (PIN / Biometric)

Core file: `src/utils/crypto.ts` — PIN hashing.
- `hashPIN()` uses Web Crypto SHA-256, with a DJB2 `simpleHash()` fallback for insecure contexts (e.g., LAN HTTP on iOS).
- PIN hash stored in `localStorage` under key `pin_hash` (64-char hex).
- `getStoredPINHash`, `setStoredPINHash`, `clearPIN` access helpers.

`docs/security_design.md` fully specifies the architecture (PIN + WebAuthn biometric via `src/utils/biometric.ts`) and references components like `PinDialog.vue` and `SecurityLock.vue`.

> **Note:** As of this writing, `src/utils/biometric.ts` is **not present** in `src/utils/` (only `crypto.ts`, `echarts-setup.ts`, `export.ts`, `format.ts`, `twemoji-bundle.ts` exist). The security doc describes the intended/future biometric design — verify current implementation state before assuming biometric features exist.

Unlock state lives in `uiStore.unlocked`. The lock layer cannot be closed by tapping the backdrop (`onPinClose` is a no-op). Wrong PIN → shake animation + input clear. App re-locks whenever `document.hidden`.

## Directory Map

```
src/
  App.vue                 # Unlock controller + theme/font-size/lock management
  main.ts                 # Bootstrap, seed, echarts setup
  env.d.ts
  components/             # Feature components under <feature>/ subfolders
    layout/               # MobileLayout.vue, TabBar.vue
    common/               # PinDialog.vue, ConfirmDialog.vue
    booking/ accounts/ stats/ transactions/
  composables/
    useLiveQuery.ts       # Dexie liveQuery → Vue ref adapter
  db/
    index.ts              # Dexie schema + migration (version 5)
    seed.ts               # Default accounts/categories
  pages/                  # Route pages (one per route)
    booking/ transactions/ accounts/ stats/ settings/
  router/index.ts         # all routes
  stores/                 # Pinia setup-stores
  styles/main.css
  types/index.ts          # All TS interfaces
  utils/
    crypto.ts format.ts export.ts echarts-setup.ts twemoji-bundle.ts
docs/
  security_design.md      # PIN + Biometric design spec (authoritative)
  trans_design.md         # Transaction design
  transfer_mb.py          # Python helper (data transfer?)
scripts/
  generate-twemoji.cjs    # Regenerates twemoji bundle
public/                   # PWA favicons + assets
```

## Types (`src/types/index.ts`)

- `Account`: `id?, name, balance, icon, sort`
- `Category`: `id?, type, parentId(null=parent), name, icon, sort`
- `Transaction`: `id?, type, title, amount(分), categoryId, tags[], note, date, time`
- `Tag`: `id?, name`
- `RecurringRule`: `id?, type, title, amount, categoryId, tags[], note, dayOfMonth, enabled, lastExecuted`
- `QuickTemplate`: `id?, name, type, amount(分), categoryId, title?, tags[], note?, sort`

## Development Workflow Reminders

- Run `npm run build` (includes `vue-tsc --noEmit`) after changes to guarantee type-checking passes.
- Always verify Dexie schema changes include a version bump + `.upgrade()` migration.
- Regenerate the twemoji bundle (`npm run generate-twemoji`) after editing the emoji list in `scripts/generate-twemoji.cjs`.
- Keep amounts integer in 分; only format with currency helpers at the UI boundary.