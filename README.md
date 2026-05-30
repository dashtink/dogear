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

### 2. Choose your HTTPS setup

Camera access on mobile **requires HTTPS** — this is enforced by all browsers (Chrome, Safari, Firefox) regardless of whether you're on a local network. It's a browser security rule, not something DogEar can work around. Pick one option:

---

#### Option A — Tailscale (easiest, recommended)

[Tailscale](https://tailscale.com) is free, installs in minutes, and gives your server a trusted HTTPS address (`https://your-machine.ts.net`) that works on all your devices with zero certificate setup.

1. Install Tailscale on your server and your phone
2. Enable [HTTPS certificates](https://tailscale.com/kb/1153/enabling-https/) in the Tailscale admin console
3. Update `Caddyfile` to use your Tailscale hostname:

```
your-machine.ts.net {
  reverse_proxy app:3000
}
```

4. Start the stack:

```bash
docker compose up -d --build
```

Access: `https://your-machine.ts.net`

---

#### Option B — Real domain with Let's Encrypt (automatic cert)

If you have a domain pointing to your server's public IP, Caddy handles everything automatically.

1. Update `Caddyfile`:

```
library.yourdomain.com {
  reverse_proxy app:3000
}
```

2. Make sure ports 80 and 443 are open on your router
3. Start the stack — cert is issued automatically on first start:

```bash
docker compose up -d --build
```

Access: `https://library.yourdomain.com`

---

#### Option C — Self-signed cert (no domain, local IP)

The default `Caddyfile` uses Caddy's internal CA. You install the root cert once per device — after that it's transparent.

1. Start the stack:

```bash
docker compose up -d --build
```

2. Export the root certificate:

```bash
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

3. Install on your devices:

**iPhone/iPad:** AirDrop or email `caddy-root.crt` to yourself → open it → Settings → General → VPN & Device Management → Install → then Settings → General → About → Certificate Trust Settings → enable the Caddy CA

**Android:** Transfer the file → Settings → Security → Encryption & credentials → Install a certificate → CA certificate

You only do this once. After that, `https://192.168.x.x` is fully trusted on that device.

Access: `https://<your-server-ip>`

---

### 3. Start

```bash
docker compose up -d --build
```

On first start, database migrations run automatically. The app is ready at your chosen address once all containers are healthy:

```bash
docker compose ps
```

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
