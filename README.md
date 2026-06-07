# DogEar

**Self-hosted personal library catalog.** Scan ISBN barcodes, track physical shelf locations, manage who's borrowed your books, and follow your reading progress.

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- 📷 **ISBN scanning** — point your phone camera at any barcode
- 🔍 **Title search** — look up books by name when you don't have the barcode
- 📚 **Rich metadata** — cover art, description, ratings, subjects, publisher, page count from OpenLibrary and Google Books
- 🗂️ **Shelf tracking** — assign books to shelves with row and position
- 🤝 **Lending** — record checkouts with borrower name, contact info, and due date
- 👥 **Contacts** — save recurring borrowers for quick checkout autocomplete
- ✅ **Reading status** — track Unread / Reading / Read with timestamps
- 📖 **Series tracking** — group books into series, see which ones you're missing
- 📊 **Stats dashboard** — reading progress, genre breakdown, pages in library, books per year
- 🌙 **Dark mode** — system-aware with manual toggle
- ✏️ **Manual editing** — update any book's metadata including cover image

---

## Requirements

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A home server, NAS, or any machine that stays on (Raspberry Pi works great)

---

## Installation

### 1. Clone the repo

```bash
git clone https://github.com/dashtink/dogear.git
cd dogear
```

### 2. Start

```bash
docker compose up -d
```

DogEar runs on **port 6300** by default. Change it by setting `DOGEAR_PORT` in a `.env` file:

```env
DOGEAR_PORT=6300
```

On first start, database migrations run automatically. Check everything is up:

```bash
docker compose ps
```

---

### HTTPS (required for camera scanning on mobile)

Browsers block camera access on plain HTTP. The easiest option if you use Tailscale:

1. Enable HTTPS in [Tailscale admin → DNS](https://login.tailscale.com/admin/dns)
2. On your server, run:
   ```bash
   tailscale serve --bg https / http://localhost:6300
   ```
3. Access DogEar at `https://your-machine.tail1234.ts.net` (no port number)

**Already have a reverse proxy?** (Nginx Proxy Manager, Traefik, Caddy, etc.)
Point it at `http://server-ip:6300` and terminate TLS there.

> Title Search and Manual ISBN both work over plain HTTP if you skip HTTPS.

---

## Auto-updates with Watchtower

If you have [Watchtower](https://containrrr.dev/watchtower/) running, DogEar updates automatically. Every push to `main` builds a new image at `ghcr.io/dashtink/dogear:latest` — Watchtower detects it and restarts the container.

No action needed on your server for updates.

---

## Usage

### Adding Books

Go to **Scan** in the nav. Three methods:

| Method | When to use |
|---|---|
| **Camera** | Point your phone at the barcode (requires HTTPS) |
| **Manual** | Type the ISBN (10 or 13 digits) |
| **Title Search** | Search by name when you don't have the book in front of you |

### Reading Status

On any book's detail page, use the **Unread / Reading / Read** toggle. Filter the library by status using the Reading and Read buttons in the library view.

### Series

Go to **Series** → **New Series**. Then assign books to a series from the book detail page using **Add to Series**. The series page shows owned vs. total count and highlights missing entries.

### Contacts

Go to **Contacts** to save borrowers. Their names will autocomplete in the checkout form.

### Shelves

Go to **Shelves** → **New Shelf**. Assign books to shelves from the book detail page.

### Lending

Open a book → **Check Out** → enter borrower details. Go to **Checkouts** to see active loans and mark books returned.

---

## Architecture

```
dogear/
├── src/
│   ├── app/
│   │   ├── api/             # REST API routes
│   │   ├── books/[id]/      # Book detail page
│   │   ├── library/         # Library grid with filters
│   │   ├── scan/            # Scanner + title search
│   │   ├── shelves/         # Shelf management
│   │   ├── checkouts/       # Loans and history
│   │   ├── contacts/        # Borrower contacts
│   │   └── series/          # Series tracking
│   ├── components/
│   │   ├── scanner/         # BarcodeScanner (ZXing), ISBNInput
│   │   ├── books/           # BookCard
│   │   ├── dashboard/       # StatCard, StatsSection
│   │   ├── shelves/         # ShelfAssignDialog
│   │   ├── checkouts/       # CheckoutForm
│   │   └── ui/              # shadcn/ui components
│   ├── db/
│   │   ├── schema.ts        # Drizzle table definitions + relations
│   │   └── migrations/      # Auto-generated SQL migrations
│   └── lib/
│       ├── isbn-lookup.ts   # OpenLibrary → Google Books fallback
│       └── validations.ts   # Zod schemas
├── Dockerfile               # Multi-stage Next.js standalone build
└── docker-compose.yml       # Postgres + App
```

**Stack:** Next.js 14 · TypeScript · PostgreSQL 16 · Drizzle ORM · Tailwind CSS · shadcn/ui

---

## Development

```bash
npm install
docker compose up db -d
cp .env.example .env.local
npx drizzle-kit migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To add a new database column: edit `src/db/schema.ts`, run `npx drizzle-kit generate`, then `npx drizzle-kit migrate`.

---

## License

MIT
