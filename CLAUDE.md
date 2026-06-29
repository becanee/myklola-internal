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

**Subfolder modules** group related features: `src/modules/settings/users/`, `src/modules/settings/roles/`, `src/modules/client/models/`, `src/modules/client/datas/`, `src/modules/client/request-logs/`.

**Server-side API routes** in `src/app/api/` — e.g. `src/app/api/chat/route.ts` proxies POST requests to `NEXT_PUBLIC_AI_CHAT_URL/chat/completions` with `Authorization: Bearer` header, streaming SSE back to the client to bypass CORS.

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

`NEXT_PUBLIC_AI_CHAT_URL` — base URL for AI chat completions (defaults to `https://ai.myklola.cloud/v1`)

`NEXT_PUBLIC_AI_CHAT_API_KEY` — Bearer token for AI chat API (`sk-...`)

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
| `"ai"` | `ChatSidebar` (real conversations) | `ChatContent` (streaming chat) |

Page module pattern (repeated in `dashboard/index.tsx`, `settings/users/index.tsx`, `settings/roles/index.tsx`, `client/datas/index.tsx`, `client/models/index.tsx`, `client/request-logs/index.tsx`):

```tsx
export function SomePage() {
  const [mode, setMode] = useState<AppMode>("dashboard")
  const {
    conversations,
    activeId,
    createConversation,
    deleteConversation,
    selectConversation,
    updateConversationMessages,
  } = useChatHistory()  // from @/modules/ai/_logic

  return (
    <SidebarProvider>
      {mode === "dashboard" ? (
        <AppSidebar mode="dashboard" onModeChange={setMode} />
      ) : (
        <ChatSidebar

          onModeChange={setMode}
          conversations={conversations}
          activeConversationId={activeId}
          onSelectConversation={selectConversation}
          onNewChat={createConversation}
          onDeleteConversation={deleteConversation}
        />
      )}
      <SidebarInset>
        {mode === "dashboard" ? <SomeContent /> : (
          <ChatContent
            activeConversationId={activeId}
            conversations={conversations}
            onNewChat={createConversation}
            onConversationUpdate={updateConversationMessages}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### Sidebar System

`AppSidebar` in `src/components/app-sidebar.tsx` is self-contained — import with only `mode` and `onModeChange` props. All navigation data lives in the inline `sidebarData` object with three sections:

| Section | Component | Group label |
|---------|-----------|-------------|
| `navMain` | `NavMain` (nav-main.tsx) | — |
| `navClient` | `NavClient` (nav-client.tsx) | "CLIENTS" |
| `navSettings` | `NavSettings` (nav-settings.tsx) | "SETTINGS" |

Each nav component uses `SidebarGroup` + `Collapsible` + `usePathname()` for active-link highlighting. `NavProjects` is available but currently commented out in the sidebar.

`ChatSidebar` in `src/components/chat-sidebar.tsx` — real conversation list sidebar. Props: `conversations`, `activeConversationId`, `onSelectConversation`, `onNewChat`, `onDeleteConversation`, `onModeChange`. Sorted by `updatedAt` descending, delete button appears on hover, "New chat" button creates a new conversation. Uses `date-fns` `formatDistanceToNow` for relative timestamps. Also re-exported from `@/modules/ai`.

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

`src/modules/ai/` provides the chat interface used in "AI" mode across all pages.

**_logic.tsx (`src/modules/ai/_logic.tsx`):**
- `Message` type — `{ id, role: "user"|"assistant", content }`
- `Conversation` type — `{ id, title, createdAt, updatedAt, messages: Message[] }`
- `StreamStatus` — `"idle" | "streaming" | "done" | "error"`
- `useChatHistory()` — conversation CRUD backed by localStorage (key `klola_chat_conversations`). Methods: `createConversation`, `deleteConversation`, `selectConversation`, `updateConversationMessages`. Auto-generates title from first user message (max 40 chars). Returns `{ conversations, activeId, loaded, ... }`.
- `useChatStream()` — SSE streaming via `fetch` + `ReadableStream` + `AbortController`. Calls `/api/chat` (server proxy). Parses OpenAI-compatible SSE format (`choices[0].delta.content` + `[DONE]` marker). Returns `{ status, selectedModel, setSelectedModel, sendMessage(messages, conversationId, model, onToken, onDone, onError), stopGeneration }`.
- `getApiChatUrl()` — reads `NEXT_PUBLIC_AI_CHAT_URL`
- `nextId()` — `crypto.randomUUID()`
- `makeTitle(text)` — truncates to 40 chars

**index.tsx (`src/modules/ai/index.tsx`):**
- `ChatContent` — full streaming chat UI. Props: `activeConversationId`, `conversations`, `onNewChat`, `onConversationUpdate`. Features: SSE streaming with token-by-token display, markdown rendering (react-markdown + remark-gfm), syntax-highlighted code blocks (react-syntax-highlighter PrismLight with copy button), typing indicator (3 bouncing dots), model selector dropdown (from `useModels`, filtered `is_active=true`), stop generation button, auto-scroll (only when near bottom), welcome screen with suggestion chips.
- `MessageBubble` — user messages plain text, assistant messages via `<MarkdownRenderer>`
- `CodeBlock` — language label + syntax highlighting + copy-to-clipboard button
- `MarkdownRenderer` — `ReactMarkdown` + `remarkGfm` with custom components (code, link, table, list, heading, blockquote)
- `ChatSidebar` — re-exported from `src/components/chat-sidebar.tsx`

**CSS layout pattern (chat container):** `flex flex-col min-h-0 flex-1` for the outer wrapper. Chat area: `flex-1 min-h-0 overflow-y-auto`. Input bar: `shrink-0`. The `min-h-0` is critical — without it flex children can't shrink below their content minimum, causing the input bar to overflow off-screen.

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
