# Copilot Instructions for Etu Web

## Project Overview

Etu is an interstitial journaling platform that helps users capture life's moments through quick, tagged markdown notes called "blips." This repository contains the webapp frontend.

### Architecture

- **etu-web** (this repo): Frontend webapp with no direct database access
- **etu-backend**: gRPC service for all data storage (users, notes, tags, API keys)
- Communication via [Connect RPC](https://connectrpc.com/)
- Shared TypeScript types via `@icco/etu-proto` package

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **React**: v19
- **TypeScript**: v5.7+ with strict mode enabled
- **Backend Client**: Connect RPC (`@connectrpc/connect`)
- **Proto Types**: `@icco/etu-proto` package (published from etu-backend)
- **Auth**: Auth.js v5 (NextAuth) with credentials via gRPC backend
- **Styling**: Tailwind CSS 4 + daisyUI 5
- **Icons**: Heroicons v2
- **Markdown**: marked + DOMPurify for sanitization
- **Payments**: Stripe
- **Testing**: Playwright for E2E tests
- **Package Manager**: Yarn

## Development Commands

```bash
# Install dependencies
yarn install

# Start development server (requires etu-backend running)
yarn dev

# Build for production
yarn build

# Run linter (ESLint)
yarn lint

# Run E2E tests (Playwright)
yarn test:e2e
yarn test:e2e:ui          # Interactive UI mode
yarn test:e2e:update      # Update snapshots
```

## Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Login/register pages (public)
│   ├── (app)/           # Protected app pages
│   ├── api/             # API routes (auth, stripe webhooks)
│   └── globals.css      # Global styles
├── components/          # Shared React components
├── lib/
│   ├── actions/         # Server actions (use gRPC backend)
│   ├── grpc/           # Connect RPC client for etu-backend
│   ├── auth.ts         # Auth.js config
│   └── stripe.ts       # Stripe utilities
├── middleware.ts        # Auth middleware
└── e2e/                # Playwright E2E tests
```

## Coding Conventions

### TypeScript

- **Always use TypeScript**: Never use `.js` or `.jsx` files
- **Strict mode enabled**: No `any` types allowed
- **Import aliases**: Use `@/` for root imports (e.g., `import { auth } from '@/lib/auth'`)
- **Type imports**: Use `import type` for type-only imports when possible

### React & Next.js

- **Server Components by default**: Use React Server Components unless you need client interactivity
- **Client Components**: Add `'use client'` directive only when needed (state, effects, browser APIs)
- **Server Actions**: Put in `lib/actions/` directory, always with `'use server'` directive
- **Async components**: Server components can be async - use this for data fetching
- **No direct database access**: All data operations go through the gRPC backend client

### Styling

- **Tailwind CSS**: Use utility classes, no custom CSS unless absolutely necessary
- **daisyUI components**: Leverage daisyUI components (btn, card, modal, etc.)
- **Responsive design**: Mobile-first approach, use Tailwind breakpoints
- **Dark mode**: Use `next-themes` for theme switching

### Code Organization

- **One component per file**: Keep components focused and single-purpose
- **Colocate related code**: Tests and types close to implementation
- **Named exports**: Prefer named exports over default exports for components
- **File naming**: Use kebab-case for files (e.g., `note-card.tsx`, `api-keys.ts`)

## Best Practices

### gRPC Backend Communication

- Always use the Connect RPC client from `lib/grpc/client.ts`
- Handle errors gracefully with try-catch blocks
- Types are defined in `@icco/etu-proto` package - never create duplicate types
- All backend calls should be in server actions or API routes (never in client components)

### Authentication

- Use `auth()` from `lib/auth.ts` in server components
- Use `useSession()` from `next-auth/react` in client components
- Protected routes are handled in `middleware.ts`
- Never expose GRPC_API_KEY or other secrets to the client

### Forms & Data Mutations

- Use Server Actions for form submissions
- Show loading states during mutations
- Provide user feedback with `sonner` toast notifications
- Validate input with Zod schemas

### Error Handling

- Server actions should return `{ success: boolean, error?: string }`
- Display errors to users with toast notifications
- Log errors but don't expose sensitive details to users

### Testing

- Write E2E tests with Playwright for critical user flows
- Test files go in `e2e/` directory
- Use page object pattern for reusable test utilities
- Run tests before submitting PRs

## Environment Variables

Required environment variables (document any new ones in README):

```env
AUTH_SECRET              # Auth.js secret
AUTH_URL                 # App URL
GRPC_BACKEND_URL         # Backend service URL
GRPC_API_KEY             # Backend API key (required)
STRIPE_SECRET_KEY        # Stripe secret (optional)
STRIPE_WEBHOOK_SECRET    # Stripe webhook secret (optional)
STRIPE_PRICE_ID          # Stripe price ID (optional)
```

## What NOT to Do

- ❌ Never use `any` type in TypeScript
- ❌ Never commit secrets or API keys
- ❌ Never bypass the gRPC backend to access databases directly
- ❌ Never create CSS files for one-off styles (use Tailwind)
- ❌ Never use `dangerouslySetInnerHTML` without DOMPurify
- ❌ Never modify `node_modules` or generated files
- ❌ Never use client-side state for sensitive data
- ❌ Don't create new authentication methods (use existing Auth.js setup)

## Common Patterns

### Server Action Example

```typescript
'use server'

import { auth } from '@/lib/auth'
import { grpcClient } from '@/lib/grpc/client'

export async function createNote(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const content = formData.get('content') as string
    const response = await grpcClient.createNote({
      content,
      userId: session.user.id,
    })
    return { success: true, data: response }
  } catch (error) {
    console.error('Failed to create note:', error)
    return { success: false, error: 'Failed to create note' }
  }
}
```

### Client Component with Server Action

```typescript
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createNote } from '@/lib/actions/notes'

export function NoteForm() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createNote(formData)

    if (result.success) {
      toast.success('Note created!')
      e.currentTarget.reset()
    } else {
      toast.error(result.error || 'Failed to create note')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="content" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Note'}
      </button>
    </form>
  )
}
```

## Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Connect RPC Documentation](https://connectrpc.com/docs/introduction/)
- [Auth.js v5 Documentation](https://authjs.dev/)
- [Tailwind CSS 4 Documentation](https://tailwindcss.com/docs)
- [daisyUI Documentation](https://daisyui.com/)
- [Playwright Documentation](https://playwright.dev/)

## Getting Help

- Check the README.md for setup instructions
- Review BLIPS.md for feature documentation
- See etu-backend repo for backend API details
- Review existing code patterns in the codebase before implementing new features
