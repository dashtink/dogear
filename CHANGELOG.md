# Changelog

All notable changes to DogEar will be documented here.

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
