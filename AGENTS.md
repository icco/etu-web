# AGENTS.md

Guidance for coding agents working on etu-web.
See [CLAUDE.md](CLAUDE.md) for Claude Code entrypoint (`@AGENTS.md`).

## Project Overview

Next.js 16 (App Router) web client for Etu. Talks via Connect RPC to `etu-backend`. Uses Auth.js v5 (NextAuth) and Tailwind CSS 4 + daisyUI 5.

## Commands

Use pnpm (`pnpm@11.2.2`, Node >= 26):
- `pnpm dev` — Start dev server (http://localhost:3000)
- `pnpm build` — Build production bundle
- `pnpm start` — Run production server
- `pnpm lint` — Run `tsc --noEmit` and `eslint --fix .`
- `pnpm test:e2e` — Run Playwright e2e test suite (automatically boots `E2E_MOCK=true`)
- `pnpm test:e2e:ui` — Run Playwright tests with interactive UI
- `pnpm test:e2e:update` — Update visual snapshots

## Architecture & Layout

- `app/(auth)/` — Login/register pages.
- `app/(app)/` — Protected pages (notes, history, search, tags, settings).
- `app/api/auth/` — NextAuth handler (`lib/auth.ts`, `lib/auth.config.ts`).
- `app/api/stripe/` — Checkout, customer portal, webhook handlers.
- `lib/actions/` — Server actions communicating with backend via `lib/grpc/client.ts`.
- `lib/grpc/mock.ts` — In-memory mock services enabled when `E2E_MOCK=true` (used in e2e tests).
- `components/` — Shared UI components styled with Tailwind CSS 4 and daisyUI 5.

## Conventions

- Conventional Commits with lowercase subjects.
- No live backend needed for tests (`E2E_MOCK=true`).
- Always run `pnpm lint` and verify tests before opening PRs.
