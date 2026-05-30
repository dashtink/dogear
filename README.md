# DogEar

**Self-hosted personal library catalog.** Scan ISBN barcodes, track physical shelf locations, and manage who's borrowed your books.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- 📷 **ISBN scanning** — point your phone camera at any barcode
- 🔍 **Title search** — look up books by name when you don't have the barcode
- 📚 **Rich metadata** — cover art, description, ratings, subjects, publisher, page count, pulled automatically from OpenLibrary and Google Books
- 🗂️ **Shelf tracking** — assign books to shelves with row and position
- 🤝 **Lending** — record checkouts with borrower name, contact info, and due date
- 📊 **Dashboard** — at-a-glance stats and recently added books

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
docker compose up -d --build
```

DogEar runs on **port 630** by default (`http://server-ip:630`). Change it by setting `DOGEAR_PORT` in a `.env` file:

```bash
# .env
DOGEAR_PORT=630   # change to any free port
```

On first start, database migrations run automatically. Check everything is up:

```bash
docker compose ps   # all services should show "healthy" or "running"
```

---

### HTTPS (required for camera scanning on mobile)

Browsers block camera access on plain HTTP. If you want to use the barcode scanner on your phone, you need HTTPS. The easiest options:

**Already have a reverse proxy?** (Nginx Proxy Manager, Traefik, Caddy, etc.)
Point it at `http://server-ip:630` and terminate TLS there. No changes to DogEar needed.

**Using Tailscale?**
1. Enable HTTPS in [Tailscale admin → DNS](https://login.tailscale.com/admin/dns)
2. Add a proxy entry pointing your Tailscale hostname to port 630

> If you don't need the barcode camera scanner (Title Search and Manual ISBN both work over plain HTTP), you can skip HTTPS entirely.

---

## Updating

### 1. Pull the latest code

```bash
git pull
```

### 2. Check the [CHANGELOG](./CHANGELOG.md) for any notes on the new version

### 3. Rebuild and restart

```bash
docker compose up -d --build
```

Database migrations run automatically on startup — no manual steps needed. Your data is preserved in the `pgdata` Docker volume.

### 4. Verify

```bash
docker compose ps        # all services: "healthy" or "running"
docker compose logs app  # look for "Ready" and migration output
```

---

## Usage

### Adding Books

Go to **Scan** in the bottom nav. Three methods:

| Method | When to use |
|---|---|
| **Camera** | Point your phone at the barcode on the back of the book |
| **Manual** | Type the ISBN (10 or 13 digits) when you can't scan |
| **Title Search** | Search by name when you don't have the book in front of you |

After lookup you'll see a preview card with the fetched metadata. Edit the title or author if needed, then tap **Add to Library**.

### Organizing with Shelves

1. Go to **Shelves** → **New Shelf** and give it a name (e.g. "Living Room Bookcase", "Bedroom")
2. On any book's detail page, tap **Assign Shelf** to set the shelf, row, and position

### Lending Books

1. Open the book's detail page → tap **Check Out**
2. Enter borrower name, optional contact, and optional due date
3. The book shows an orange "on loan" banner
4. Go to **Checkouts** to see all active loans — tap **Mark Returned** when the book comes back

### Searching the Library

On the **Library** page:
- Search box filters by title or author (debounced, updates as you type)
- Shelf dropdown shows books on a specific shelf
- **On Loan** button filters to only checked-out books

---

## Architecture

```
dogear/
├── src/
│   ├── app/
│   │   ├── api/          # REST API routes
│   │   │   ├── books/    # GET (search/filter), POST (add)
│   │   │   ├── books/[id]/  # GET, PATCH, DELETE + location assignment
│   │   │   ├── checkouts/   # GET, POST, PATCH (return)
│   │   │   ├── isbn/[isbn]/ # Metadata proxy
│   │   │   ├── search/      # Title search proxy (OpenLibrary)
│   │   │   └── shelves/     # GET, POST, PATCH, DELETE
│   │   ├── books/[id]/   # Book detail page
│   │   ├── library/      # Library grid
│   │   ├── scan/         # Scanner + title search
│   │   ├── shelves/      # Shelf management
│   │   └── checkouts/    # Loans and history
│   ├── components/
│   │   ├── scanner/      # BarcodeScanner (ZXing), ISBNInput
│   │   ├── books/        # BookCard
│   │   ├── shelves/      # ShelfAssignDialog
│   │   ├── checkouts/    # CheckoutForm
│   │   └── ui/           # shadcn/ui components
│   ├── db/
│   │   ├── schema.ts     # Drizzle table definitions + relations
│   │   └── migrations/   # Auto-generated SQL migrations
│   └── lib/
│       ├── isbn-lookup.ts  # OpenLibrary → Google Books fallback
│       └── validations.ts  # Zod schemas
├── Dockerfile            # Multi-stage Next.js standalone build
├── docker-compose.yml    # Postgres + App + Caddy
└── Caddyfile             # HTTPS reverse proxy config
```

**Stack:** Next.js 14 · TypeScript · PostgreSQL 16 · Drizzle ORM · Tailwind CSS · shadcn/ui · Caddy 2

---

## Development

```bash
# Install dependencies
npm install

# Start Postgres only
docker compose up db -d

# Copy env
cp .env.example .env.local

# Run migrations
npx drizzle-kit migrate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To add a new database column: edit `src/db/schema.ts`, then run `npx drizzle-kit generate` to create the migration, and `npx drizzle-kit migrate` to apply it locally.

---

## License

MIT
