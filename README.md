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
_(Coming in a separate PR)_

The backend API server will provide:
- gRPC and HTTP/JSON APIs
- Authentication with API keys
- Persistent storage
- Stripe payment integration
- Multi-client support (web, CLI, mobile)

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **UI Framework**: Radix UI + Tailwind CSS 4
- **Icons**: Phosphor Icons
- **Markdown**: marked + DOMPurify
- **State Management**: GitHub Spark KV (browser storage)
- **Animations**: tw-animate-css + custom keyframes

## Development

### Prerequisites
- Node.js 18+ (see `.nvmrc`)
- Yarn or npm

### Setup

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Lint code
yarn lint
```

The development server runs at http://localhost:5000

## Project Structure

```
src/
├── components/
│   ├── LandingPage.tsx      # Marketing landing page
│   ├── AppView.tsx          # Main application view with notes timeline
│   ├── NoteCard.tsx         # Individual note display with full view dialog
│   ├── NoteDialog.tsx       # Note creation/editing modal with markdown preview
│   ├── SettingsDialog.tsx   # User settings (account, stats, subscription, API keys)
│   └── ui/                  # Reusable UI components (shadcn/ui)
├── lib/
│   ├── types.ts             # TypeScript type definitions
│   ├── note-utils.ts        # Note filtering, grouping, tag utilities
│   └── utils.ts             # General utilities (cn helper)
├── styles/
│   └── theme.css            # Tailwind theme configuration
├── index.css                # Global styles, CSS variables, animations
├── App.tsx                  # Root component with auth state
└── main.tsx                 # Application entry point
```

## Key Components

### AppView
The main application view featuring:
- Header with search and new note button
- Tag and date range filtering
- Grouped notes timeline
- Mobile bottom navigation

### NoteDialog
Modal for creating/editing notes with:
- Markdown textarea with live preview toggle
- Tag input with autocomplete from existing tags
- Keyboard shortcuts (Cmd+Enter to save)

### NoteCard
Individual note display with:
- Markdown preview (stripped for card view)
- Full rendered markdown view on click
- Edit/delete actions via dropdown menu
- Search term highlighting

### SettingsDialog
Settings with tabs for:
- **Account**: User info
- **Stats**: Usage statistics (notes, tags, words, activity chart) + data export
- **Subscription**: Billing management
- **API Keys**: Create and manage API keys for CLI/mobile access

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `n` | Create new blip |
| `/` | Focus search |
| `Esc` | Clear filters |
| `Cmd+Enter` | Save note (in dialog) |

## Design System

### Colors
- **Primary**: Deep ink blue `oklch(0.25 0.08 250)` - Headers, text
- **Accent**: Amber highlight `oklch(0.75 0.15 75)` - CTAs, buttons
- **Background**: Warm paper `oklch(0.95 0.015 85)` - Main background
- **Secondary**: Sage green `oklch(0.70 0.08 150)` - Success states

### Typography
- **Headings**: Newsreader (serif)
- **Body**: Space Grotesk (sans-serif)
- **Code**: JetBrains Mono (monospace)

Fonts are loaded from Google Fonts in `index.html`.

### Animations
- Modal: Scale-in on open (200ms ease-out)
- Buttons: Scale down on press (0.98)
- Cards: Hover lift effect, stagger fade-in
- Tags: Zoom-in animation on add

## Current Limitations

This implementation uses browser-based local storage via GitHub Spark KV. For production use:

1. **Backend API Server** - RESTful/gRPC API for data persistence
2. **Authentication** - Proper user authentication (currently just a toggle)
3. **Payment Integration** - Stripe integration for subscriptions
4. **Database** - PostgreSQL for persistent storage
5. **Sync** - Real-time sync across devices

## Related Projects

- **CLI Client**: https://github.com/icco/etu
- **Mobile App**: https://github.com/icco/etu-mobile

## Docker

Build and run with Docker:

```bash
docker build -t etu-server .
docker run -p 80:80 etu-server
```

## License

MIT License - Copyright (c) 2024 Etu

GitHub Spark Template resources are licensed under the MIT license, Copyright GitHub, Inc.
