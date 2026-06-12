# CLAUDE.md

Next.js 16 (App Router) web client for Etu, an interstitial journaling platform built around quick tagged markdown notes ("blips" — see BLIPS.md for the concept). No database here; all data goes through Connect RPC to [etu-backend](https://github.com/icco/etu-backend).

## Commands

Package manager is **pnpm** (`pnpm@11.2.2`, Node >= 26). Installing `@icco/etu-proto` requires GitHub Packages auth for the `@icco` scope.

- `pnpm dev` — start dev server (http://localhost:3000)
- `pnpm build` — production build
- `pnpm start` — serve production build
- `pnpm lint` — `tsc --noEmit` then `eslint --fix .`
- `pnpm test:e2e` — run Playwright e2e tests
- `pnpm test:e2e:ui` — Playwright UI mode
- `pnpm test:e2e:update` — update visual snapshots

## Architecture

- `app/(auth)/` — login/register pages; `app/(app)/` — protected pages (notes, history, search, tags, settings), each a server `page.tsx` plus a client `*-view.tsx`
- `app/api/auth/[...nextauth]/` — NextAuth handlers; `app/api/stripe/` — checkout, portal, webhook routes; `app/docs/` — generated proto API docs
- `lib/actions/` — server actions (notes, auth, user, api-keys) that call the backend via `lib/grpc/client.ts` (Connect RPC client + proto↔view type converters)
- `lib/auth.ts` / `lib/auth.config.ts` — Auth.js v5 (NextAuth) config, JWT session strategy, credentials validated against the gRPC backend; `middleware.ts` guards routes
- `lib/grpc/mock.ts` — in-memory mock services, enabled when `E2E_MOCK=true`
- `lib/types.ts` — view-layer types (proto Timestamp → Date); `lib/stripe.ts` — Stripe client
- Styling: Tailwind CSS 4 + daisyUI 5; shared UI in `components/`

## E2E tests

Playwright specs live in `e2e/` with visual snapshots in `e2e/*.spec.ts-snapshots/` (chromium + mobile projects, Linux snapshots). The config auto-starts `E2E_MOCK=true pnpm dev`, so no real backend is needed. CI runs lint and e2e on every PR (`.github/workflows/ci.yml`).

## Environment

`.env.local`: `AUTH_SECRET`, `AUTH_URL`, `GRPC_BACKEND_URL`, `GRPC_API_KEY` (required); optional Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`. See README.md for details.
