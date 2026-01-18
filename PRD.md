# Etu - Interstitial Journaling Platform

Etu is a modern, open-source interstitial journaling platform that captures life's moments through quick, tagged markdown notes called "blips" - enabling effortless reflection and powerful recall.

**Experience Qualities**:
1. **Effortless** - Capturing thoughts should feel friction-free, like jotting in a notebook but with the power of search and organization
2. **Purposeful** - Every design element serves the core mission of quick capture and easy retrieval without unnecessary complexity
3. **Trustworthy** - Users are entrusting their thoughts and memories; the interface should feel stable, secure, and respectful of their content

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a full-featured application with authentication, payment processing, CRUD operations for notes, search functionality, API key management, subscription management, and distinct marketing/app experiences. It requires multiple views (landing, app, settings) and sophisticated state management.

## Essential Features

### Marketing Landing Page
- **Functionality**: Presents Etu's value proposition, pricing, and signup
- **Purpose**: Convert visitors into paying subscribers by clearly communicating benefits
- **Trigger**: User visits the root URL while not authenticated
- **Progression**: View hero section → Read about blips/interstitial journaling → See pricing → Click signup → Enter payment details → Create account
- **Success criteria**: Clear call-to-action, compelling copy about interstitial journaling, Stripe checkout integration

### Note Creation & Management
- **Functionality**: Quick capture interface for markdown notes with tags, view/edit/delete existing notes
- **Purpose**: Core journaling functionality - make it trivial to capture thoughts
- **Trigger**: User clicks "New Blip" or presses keyboard shortcut
- **Progression**: Open quick-capture modal → Type markdown content → Add tags (comma-separated or tag picker) → Save → Note appears in feed
- **Success criteria**: Modal opens/closes smoothly, markdown renders correctly, tags are saved and searchable

### Note Browsing & Timeline
- **Functionality**: Chronological feed of notes with infinite scroll, grouped by date
- **Purpose**: Review past thoughts and track personal history
- **Trigger**: User navigates to main app view after login
- **Progression**: Load recent notes → Scroll to load more → Click note to expand/edit → Filter by tags or date range
- **Success criteria**: Smooth scrolling, date grouping is clear, notes load efficiently

### Search & Filtering
- **Functionality**: Full-text search across note content and tags, filter by date range and tags
- **Purpose**: Quick retrieval of past thoughts and insights
- **Trigger**: User types in search box or clicks tag filters
- **Progression**: Enter search term → Results filter in real-time → Click result to view full note → Clear search to return to timeline
- **Success criteria**: Fast search response, highlighted search terms, intuitive filter UI

### Settings & Account Management
- **Functionality**: Manage subscription, generate/revoke API keys, view usage stats
- **Purpose**: Give users control over their account and enable CLI/mobile access
- **Trigger**: User clicks settings/account icon
- **Progression**: Navigate to settings → View current subscription → Manage payment method → Generate API key → Copy key (shown once) → Revoke old keys
- **Success criteria**: Clear subscription status, secure API key generation with one-time display, Stripe customer portal integration

### Authentication System
- **Functionality**: Login/logout flow with session persistence
- **Purpose**: Secure access to personal journal entries
- **Trigger**: User attempts to access app features
- **Progression**: Detect unauthenticated state → Redirect to login → Enter credentials → Authenticate → Redirect to app
- **Success criteria**: Persistent sessions, secure token storage, automatic redirect flows

## Edge Case Handling

- **Markdown Parsing Errors**: Gracefully render malformed markdown, show preview before saving
- **Empty States**: Show helpful prompts when no notes exist, when search returns no results, or when no tags are used
- **Network Failures**: Queue note saves locally, retry on reconnection, show clear sync status
- **Expired Sessions**: Auto-redirect to login with message, preserve unsaved content in draft
- **Large Note Collections**: Implement pagination/infinite scroll, virtualized lists for performance
- **Special Characters in Tags**: Sanitize tag input, show validation feedback
- **Duplicate API Keys**: Prevent duplicate names, show clear labels/descriptions for each key
- **Payment Failures**: Clear error messages from Stripe, ability to update payment method

## Design Direction

The design should evoke a sense of calm focus and intellectual clarity - like a well-organized personal library or a clean notebook. It should feel lightweight and fast, never getting in the way of capturing thoughts. The aesthetic should balance modern web app polish with the timeless simplicity of paper journaling. Users should feel that this is a tool for thinkers, writers, and reflective individuals who value their ideas.

## Color Selection

A sophisticated palette inspired by analog journaling - warm paper tones with deep ink accents for a refined, literary aesthetic.

- **Primary Color**: Deep ink blue `oklch(0.25 0.08 250)` - Represents the permanence of written thought, serious but not corporate
- **Secondary Colors**: 
  - Warm paper beige `oklch(0.95 0.015 85)` for soft backgrounds that reduce eye strain
  - Sage green `oklch(0.70 0.08 150)` for success states and subtle accents
- **Accent Color**: Amber highlight `oklch(0.75 0.15 75)` - Like a yellow highlighter on important passages, used for CTAs and active states
- **Foreground/Background Pairings**:
  - Primary (Deep Ink Blue #1C2849): White text (#FFFFFF) - Ratio 11.5:1 ✓
  - Accent (Amber #E5AF56): Dark text (#1C2849) - Ratio 7.2:1 ✓
  - Background (Warm Paper #F8F6F2): Ink text (#1C2849) - Ratio 13.8:1 ✓
  - Muted (Soft Gray #E8E5DF): Ink text (#1C2849) - Ratio 11.2:1 ✓

## Font Selection

Typography should feel editorial and literary - like reading a well-designed publication - with excellent readability for long-form content.

- **Primary Font**: Newsreader (serif) for headings and emphasis - brings editorial gravitas and literary quality
- **Body Font**: Space Grotesk (sans-serif) for UI elements and body text - modern, clean, highly readable at all sizes
- **Code Font**: JetBrains Mono for markdown code blocks and technical elements

**Typographic Hierarchy**:
- H1 (Hero Title): Newsreader Bold/48px/tight letter-spacing, line-height 1.1
- H2 (Section Headers): Newsreader SemiBold/32px/normal spacing, line-height 1.2
- H3 (Card Titles): Space Grotesk Medium/18px/slight tracking, line-height 1.4
- Body (Primary): Space Grotesk Regular/16px/normal spacing, line-height 1.6
- Small (Metadata): Space Grotesk Regular/14px/wider tracking, line-height 1.5
- Code: JetBrains Mono Regular/14px/normal spacing

## Animations

Animations should feel intentional and calming, like pages turning in a book or ink settling on paper. Use subtle motion to guide attention without creating distraction.

- **Note Creation**: Modal slides up with gentle ease, backdrop fades in (300ms ease-out)
- **Note Saving**: Success checkmark with subtle scale pulse, fade to timeline
- **Scrolling**: Smooth scroll with momentum, gentle fade-in for newly loaded notes
- **Interactions**: Soft hover states (150ms), button press feels tactile with slight scale (0.98)
- **Search**: Results fade in with stagger effect (50ms delay per item)
- **Page Transitions**: Crossfade between views (200ms) maintaining spatial continuity
- **Tag Selection**: Pills have soft spring animation on add/remove

## Component Selection

**Components**:
- **Dialog**: For new note creation modal with markdown editor and tag input
- **Card**: For individual note display in timeline with hover states
- **Button**: Primary (amber accent), secondary (ink blue), ghost for subtle actions
- **Input/Textarea**: For note content, search, and tag entry with focus states
- **Badge**: For tag pills with interactive hover states
- **Scroll-Area**: For note timeline with smooth infinite scroll
- **Separator**: Subtle dividers between date groups
- **Dropdown-Menu**: For note actions (edit, delete, share)
- **Tabs**: For settings navigation (account, subscription, API keys)
- **Alert-Dialog**: For destructive actions like note deletion

**Customizations**:
- Custom markdown editor component with preview toggle
- Tag input with autocomplete from existing tags
- Date group headers with sticky positioning
- Search highlight component for matched terms
- Empty state illustrations for no notes/no results

**States**:
- Buttons: Idle with soft shadow → Hover with lift effect → Active with scale down → Disabled with reduced opacity
- Inputs: Rest with subtle border → Focus with accent ring and label color shift → Error with red ring
- Cards: Rest subtle shadow → Hover elevated shadow with border accent → Active/selected with accent border
- Tags: Rest with muted bg → Hover with darker bg → Selected with accent bg

**Icon Selection**:
- NotePencil: Create new note
- MagnifyingGlass: Search
- Tag: Tag management
- Calendar: Date filters
- Key: API key generation
- CreditCard: Subscription management
- SignOut: Logout
- DotsThree: Note actions menu
- Check: Save/confirm actions
- X: Close/cancel

**Spacing**:
- Container padding: p-6 (24px) on mobile, p-8 (32px) on desktop
- Card internal spacing: p-4 (16px)
- Section gaps: gap-8 (32px) for major sections, gap-4 (16px) for related content
- Button padding: px-6 py-3 for primary, px-4 py-2 for secondary
- Consistent 8px grid system throughout

**Mobile**:
- Single column layout with full-width cards
- Bottom navigation bar for main actions (new note, search, settings)
- Swipe gestures for note actions
- Collapsible search/filter bar
- Simplified note view with tap to expand
- Touch-optimized hit targets (min 44px)
- Stack settings tabs vertically
