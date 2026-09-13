# Changelog

All notable changes to DogEar will be documented here.

## [0.3.1] – 2026-09-12

### Security
- Updated Next.js to 16.x and React to 19.x — fixes critical Image Optimizer DoS CVE (GHSA-9g9p) and 8 high-severity CVEs
- Tightened `remotePatterns` in next.config.mjs: `*.googleusercontent.com` → `lh3.googleusercontent.com`
- Added `.env.production` / `.env.development` / `.env.staging` to `.gitignore`
- Added prominent no-auth / don't-expose-to-internet warning to README

### Fixed
- All dynamic route handlers (`[id]`, `[isbn]`) updated for Next.js 15/16 async `params` requirement
- Added `isNaN` guard on all `parseInt(params.id)` calls — returns 400 instead of 500 on invalid IDs

## [0.3.0] – 2026-09-12

### Added
- Color theme presets — Default, Forest, Ocean, Rose, Amber — each with light and dark variants
- Custom accent color picker — choose any color, applied instantly without a page reload
- Theme selector (palette icon) in the sidebar alongside the existing light/dark toggle
- Theme preference persisted to localStorage; restored before first paint to avoid flash

## [0.2.1] – 2026-09-12

### Changed
- Docker images now published to `dashtink/dogear` on Docker Hub and `ghcr.io/dashtink/dogear` on GHCR following migration from the ProductColab GitHub org back to dashtink

## [0.2.0] – 2026-06-03

### Added
- Reading status tracking — Unread / Reading / Read toggle per book with timestamps
- Status badge overlays on library cards
- Reading / Read filter buttons in library view
- Library & reading stats dashboard: books read, currently reading, total pages, average pages, average publication year, top genres (donut chart), books finished by year (bar chart), longest/shortest book
- Dark mode — system-aware theme with manual toggle in sidebar
- Borrower contacts — save recurring borrowers with name, email, phone, notes
- Checkout form autocomplete — suggests saved contacts as you type borrower name
- Series tracking — create series, assign books with position, see owned vs. missing
- Series detail page with ordered book list and placeholder slots for missing entries
- Manual book editing — update title, author, cover URL, year, genre, publisher, description, page count from the book detail page
- Tailscale HTTPS support via `tailscale serve`
- Auto-deploy via GitHub Actions → GHCR → Watchtower

### Fixed
- Camera error on HTTP — clear message directing users to HTTPS alternatives instead of cryptic crash

## [0.1.0] – 2026-05-30

### Added
- ISBN barcode scanning via device camera (rear camera auto-selected on mobile)
- Manual ISBN entry with validation
- Title search via OpenLibrary
- Book metadata auto-fetch: title, author, cover, publisher, year, description, ratings, subjects, language, first published year
- Google Books fallback when OpenLibrary has no data
- Physical shelf + row + position tracking
- Checkout / lending management with borrower name, contact, due date
- Checkout history per book
- Library grid with search, shelf filter, and on-loan filter
- Book detail page with full metadata display
- Dashboard with stats (total books, on loan, overdue, added this month)
- Docker Compose deployment (Postgres 16 + Next.js + Caddy HTTPS)
- Drizzle ORM with auto-run migrations on startup
