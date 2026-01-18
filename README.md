# Etu Server

Etu is an interstitial journaling platform that helps you capture life's moments through quick, tagged markdown notes called "blips."

Read more about the concept at https://writing.natwelch.com/post/765

## Features

### Landing Page
A modern marketing page that introduces Etu, explains interstitial journaling, and showcases features with honest pricing ($5/year).

### Web Client
A full-featured journaling application with:
- **Quick Capture**: Write notes in Markdown with live preview (Cmd+Enter to save)
- **Tag System**: Organize notes with custom tags (autocomplete from existing tags)
- **Search & Filter**: Find notes by content, tags, or date range
- **Timeline View**: Browse notes chronologically with date grouping
- **Full Note View**: Click any note to see rendered markdown
- **Settings**: Manage account, view stats, export data, and manage API keys
- **Keyboard Shortcuts**: Press `n` for new note, `/` to search, `Esc` to clear filters
- **Mobile Support**: Bottom navigation bar on mobile devices

### API Server
A complete REST API backend with:
- **Authentication**: JWT tokens and API keys for CLI/mobile access
- **Notes CRUD**: Create, read, update, delete notes with full-text search
- **Tags**: Tag management with rename, delete, and merge operations
- **User Management**: Registration, login, account stats
- **Stripe Integration**: Subscription payments and billing portal
- **SQLite Database**: Local persistent storage (PostgreSQL-ready schema)

## Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **UI Framework**: Radix UI + Tailwind CSS 4
- **Icons**: Phosphor Icons
- **Markdown**: marked + DOMPurify
- **Animations**: tw-animate-css + custom keyframes

### Backend
- **Runtime**: Node.js 22 + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3) with FTS5 full-text search
- **Auth**: JWT + bcrypt for password hashing
- **Validation**: Zod schemas
- **Payments**: Stripe SDK

## Quick Start

### Development (Frontend Only)

```bash
# Install dependencies
yarn install

# Start development server (uses local storage)
yarn dev
```

The frontend runs at http://localhost:5000 and works offline with browser storage.

### Development (Full Stack)

```bash
# Install frontend dependencies
yarn install

# Install API server dependencies
cd server && npm install && cd ..

# Start API server (in one terminal)
cd server && npm run dev

# Start frontend (in another terminal)
yarn dev
```

The API server runs at http://localhost:3001, frontend at http://localhost:5000.

### Production (Docker)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t etu-server .
docker run -p 8080:80 -v etu-data:/app/data etu-server
```

Access at http://localhost:8080

## Project Structure

```
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   ├── AppView.tsx     # Main app with notes timeline
│   │   ├── AuthDialog.tsx  # Login/register modal
│   │   ├── NoteCard.tsx    # Note display with view dialog
│   │   ├── NoteDialog.tsx  # Note creation/editing
│   │   ├── SettingsDialog.tsx # Settings with stats & export
│   │   └── ui/             # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts          # API client
│   │   ├── types.ts        # TypeScript types
│   │   └── note-utils.ts   # Note utilities
│   └── index.css           # Global styles
│
├── server/                 # API server source
│   ├── src/
│   │   ├── index.ts        # Express app entry
│   │   ├── routes/         # API route handlers
│   │   │   ├── auth.routes.ts
│   │   │   ├── notes.routes.ts
│   │   │   ├── tags.routes.ts
│   │   │   ├── apikeys.routes.ts
│   │   │   └── stripe.routes.ts
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── db/             # Database schema & setup
│   │   └── types/          # TypeScript types
│   └── package.json
│
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Easy deployment
└── nginx.conf              # Reverse proxy config
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user + stats |
| POST | `/api/auth/refresh` | Refresh JWT token |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List notes (with search, tags, date filters) |
| POST | `/api/notes` | Create note |
| GET | `/api/notes/:id` | Get single note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List all tags with note counts |
| PUT | `/api/tags/:id` | Rename tag |
| DELETE | `/api/tags/:id` | Delete tag |
| POST | `/api/tags/:id/merge` | Merge into another tag |

### API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/api-keys` | List API keys |
| POST | `/api/api-keys` | Create API key (returns key once) |
| DELETE | `/api/api-keys/:id` | Revoke API key |

### Stripe (Subscriptions)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe/create-checkout` | Create checkout session |
| POST | `/api/stripe/create-portal` | Create billing portal session |
| POST | `/api/stripe/webhook` | Handle Stripe webhooks |

## Authentication

The API supports two authentication methods:

### JWT Token (Web)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Use the token
curl http://localhost:3001/api/notes \
  -H "Authorization: Bearer <token>"
```

### API Key (CLI/Mobile)
```bash
# Create an API key in settings, then use it:
curl http://localhost:3001/api/notes \
  -H "Authorization: ApiKey etu_abc123..."

# Or directly:
curl http://localhost:3001/api/notes \
  -H "Authorization: etu_abc123..."
```

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=./data/etu.db

# Auth
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5000
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `n` | Create new blip |
| `/` | Focus search |
| `Esc` | Clear filters |
| `Cmd+Enter` | Save note (in dialog) |

## Design System

### Colors
- **Primary**: Deep ink blue `oklch(0.25 0.08 250)`
- **Accent**: Amber highlight `oklch(0.75 0.15 75)`
- **Background**: Warm paper `oklch(0.95 0.015 85)`
- **Secondary**: Sage green `oklch(0.70 0.08 150)`

### Typography
- **Headings**: Newsreader (serif)
- **Body**: Space Grotesk (sans-serif)
- **Code**: JetBrains Mono (monospace)

## Related Projects

- **CLI Client**: https://github.com/icco/etu
- **Mobile App**: https://github.com/icco/etu-mobile

## License

MIT License - Copyright (c) 2024 Etu
