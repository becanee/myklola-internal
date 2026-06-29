# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev    # start dev server
bun run build  # production build (output: standalone mode)
bun run start  # start production server (runs .next/standalone/server.js)
bun add <pkg>  # install dependencies (always use bun, never npm)
bunx <cmd>     # run one-off packages
```

No test runner is configured yet.

`ignoreScripts` in package.json skips `sharp` and `unrs-resolver` postinstall scripts — these packages are in `trustedDependencies`.

## Docker

Multi-stage Dockerfile using `oven/bun:1`. Three stages: dependencies (`bun install --frozen-lockfile`) → builder (`bun run build`) → runner (copies `.next/standalone` + `.next/static`, runs as non-root `bun` user on port 3000). Build output is `standalone` mode (configured in `next.config.ts`).

## Architecture

Next.js 16.2.9 App Router + React 19 + Tailwind CSS v4 + TypeScript strict mode. Auth via Clerk. Package manager is **bun**. Path alias `@/*` maps to `./src/*`.

### Module System

```
src/app/<route>/              # Server page wrappers — thin, import from modules
src/modules/<module>/         # Client component modules
  index.tsx                   # Entry point + UI components with JSX
  _logic.tsx                  # Pure logic: types, constants, data, hooks — NO JSX
src/modules/shared/           # Cross-module components (ModeSwitcher, PageHeader)
src/components/               # Global shared components (sidebar, nav bars, theme)
src/components/ui/            # shadcn/ui primitives (auto-generated, never hand-edit)
src/req/base_req.ts           # Axios API helpers
src/hooks/                    # Generic React hooks (use-mobile)
src/lib/utils.ts              # cn() utility (clsx + tailwind-merge)
```

**Module rule:** Each module folder may ONLY contain `index.tsx` + `_logic.tsx`. All sidebar, nav, and layout components live in `src/components/`.

**Subfolder modules** group related features: `src/modules/settings/users/`, `src/modules/client/models/`, etc.

**Shared components** in `src/modules/shared/index.tsx`:
- `ModeSwitcher` — segmented control for toggling `AppMode` ("dashboard" | "ai"), adapts to collapsed sidebar
- `PageHeader` — header bar with children slot, UserButton (Clerk), and `AnimatedThemeToggler`
- Re-exports `AppMode` type from `_logic.tsx`

### Auth (Clerk)

`src/proxy.ts` — Next.js 16 equivalent of middleware (renamed in v16). Uses `clerkMiddleware()` with `createRouteMatcher`:
- **Public routes:** `/sign-in(.*)` and `/v1(.*)` — everything else protected via `auth.protect()`
- Post sign-in redirects to `/` (dashboard)
- `<ClerkProvider>` wraps root layout in `src/app/layout.tsx`
- Sign-in page: `src/app/sign-in/[[...sign-in]]/page.tsx`

**Getting session ID:**
- Server: `const { sessionId } = await auth()` from `@clerk/nextjs/server`
- Client: `const { session } = useSession()` from `@clerk/nextjs` → `session?.id`
- Client user ID: `const { user } = useUser()` from `@clerk/nextjs` → `user?.id`

Env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

`NEXT_PUBLIC_API_URL` — base URL for the axios API instance (defaults to `https://api.myklola.cloud/webhook-test/gateway`)

### Pages

| Route | Server page | Module |
|-------|-----------|--------|
| `/` | `src/app/page.tsx` | `@/modules/dashboard` |
| `/settings/users` | `src/app/settings/users/page.tsx` | `@/modules/settings/users` |
| `/settings/roles` | `src/app/settings/roles/page.tsx` | `@/modules/settings/roles` |
| `/client/models` | `src/app/client/models/page.tsx` | `@/modules/client/models` |
| `/client/datas` | `src/app/client/datas/page.tsx` | `@/modules/client/datas` |
| `/client/request-logs` | `src/app/client/request-logs/page.tsx` | `@/modules/client/request-logs` |
| `/sign-in` | `src/app/sign-in/[[...sign-in]]/page.tsx` | Clerk `<SignIn />` |

**Thin server page pattern** — each `page.tsx` just imports and renders the module's page component:
```tsx
import { UsersPage } from "@/modules/settings/users"
export default function Page() { return <UsersPage /> }
```

### Mode Switching (Dashboard ↔ AI)

Every page module uses the same pattern. `ModeSwitcher` segmented control toggles two modes:

| Mode | Sidebar | Content |
|------|---------|---------|
| `"dashboard"` | `AppSidebar` | `PageHeader` + page-specific content |
| `"ai"` | `ChatSidebar` (chat history) | `ChatContent` (message bubbles + input) |

Mode state: `useState<AppMode>("dashboard")` in each page module. `AppMode` defined in `src/modules/shared/_logic.tsx`.

### Sidebar System

`AppSidebar` in `src/components/app-sidebar.tsx` is self-contained — import with only `mode` and `onModeChange` props. All navigation data lives in the inline `sidebarData` object with three sections:

| Section | Component | Group label |
|---------|-----------|-------------|
| `navMain` | `NavMain` (nav-main.tsx) | — |
| `navClient` | `NavClient` (nav-client.tsx) | "CLIENTS" |
| `navSettings` | `NavSettings` (nav-settings.tsx) | "SETTINGS" |

Each nav component uses `SidebarGroup` + `Collapsible` + `usePathname()` for active-link highlighting. `NavProjects` is available but currently commented out in the sidebar. `NavUser` is the user avatar dropdown in the sidebar footer.

`ChatSidebar` in `src/components/chat-sidebar.tsx` — AI chat history list. Consumes `chatHistory` from `@/modules/ai/_logic`. Also re-exported from `@/modules/ai`.

### API Requests

`src/req/base_req.ts` exports 5 typed helpers wrapping an axios instance (`baseURL` = `NEXT_PUBLIC_API_URL` env var):

```
get<T>(url, opts?)   post<T>(url, data?, opts?)
put<T>(url, data?, opts?)   patch<T>(url, data?, opts?)
del<T>(url, opts?)
```

`opts` extends `AxiosRequestConfig` with optional `sessionId`. When provided, `x-session-id` header is auto-appended to the request.

API responses follow `{ status: boolean, httpCode: number, poweredBy: string, data: T, message?: string }`. Each module defines its own `ApiResponse<T>` type in `_logic.tsx`.

### Fetching Pattern (Client-Side)

Custom hooks in `_logic.tsx` consume `useSession()` from Clerk and call helpers from `base_req`:

- **List hooks** (`useUsers`, `useRoles`, `useModels`): return `{ data: T[], loading, error, refetch }`. Auto-fetch on mount when session is available.
- **Detail hooks** (`useUserDetail`, `useRoleDetail`, `useModelDetail`): return `{ data: T | null, loading, error, fetchDetail(id) }`. Manually triggered.
- **Mutation hooks** (`useUpdateUser`, `useCreateRole`, `useDeleteModel`, etc.): return `{ loading, mutate(...) }` where `mutate` returns `{ ok: boolean, message: string }`.
- `useRolesList` — special hook that returns only `{ key, name, is_active }` for select dropdowns.

### AI Module

`src/modules/ai/` provides the chat interface used in "AI" mode across all pages:
- `ChatContent` — full chat UI: welcome screen with suggestion chips, message bubbles (user/assistant), textarea input with Enter-to-send
- `ChatSidebar` — re-exported from `src/components/chat-sidebar.tsx`, shows static chat history from `_logic.tsx`
- `Message` type (`{ id, role: "user"|"assistant", content }`) — AI responses are currently placeholder text, not wired to a real backend

### Styling

- Tailwind CSS v4 + `tw-animate-css` + `shadcn/tailwind.css`
- shadcn/ui `radix-maia` style, zinc base, CSS variables in OKLCH, `components.json` at root
- Add shadcn components: `bunx shadcn@latest add <component>`
- Icon libraries: `@tabler/icons-react` (primary), `lucide-react` (installed), `@hugeicons/react` (installed)
- Fonts: Space Grotesk (`--font-sans`), Montserrat (`--font-heading`), Geist (`--font-geist-sans`), Geist Mono (`--font-geist-mono`)
- Dark mode: `next-themes` (class strategy, system default, `disableTransitionOnChange`). Wrapper in `src/components/theme-provider.tsx`
- `cn()` from `src/lib/utils.ts` for className merging (clsx + tailwind-merge)
- `Toaster` with `position="top-center" richColors` via `sonner`
- View transitions: disabled default animation for theme switching smoothness
