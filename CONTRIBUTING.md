# Contributing to Stackarr

Thanks for your interest in contributing! This is a small personal project welcoming bug fixes, improvements, and new features.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker + Docker Compose (for Postgres)
- Git

### Local Setup

```bash
git clone https://github.com/dashtink/stackarr.git
cd stackarr
npm install

# Start Postgres
docker compose up db -d

# Copy env
cp .env.example .env.local

# Run migrations
npx drizzle-kit migrate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Making Changes

### Database changes

Edit `src/db/schema.ts`, then:

```bash
npx drizzle-kit generate   # creates migration file
npx drizzle-kit migrate    # applies it locally
```

Commit the generated migration file alongside your schema change.

### Code style

- TypeScript strict mode — no `any` unless unavoidable
- Components in `src/components/`, pages in `src/app/`
- API routes use Zod validation via `src/lib/validations.ts`
- Keep client components (`"use client"`) minimal — prefer Server Components

### Running type checks

```bash
npx tsc --noEmit
```

## Submitting a Pull Request

1. Fork the repo and create a branch: `git checkout -b my-feature`
2. Make your changes and run `npx tsc --noEmit` to check for errors
3. Commit with a clear message describing what and why
4. Push and open a PR against `main`
5. Describe what your change does and include screenshots for UI changes

## Reporting Bugs

Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) issue template. Please include:
- Steps to reproduce
- Expected vs actual behaviour
- Browser/OS/device if it's a UI issue
- Docker version if it's a deployment issue

## Requesting Features

Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) template.

## Questions

Open a [Discussion](https://github.com/dashtink/stackarr/discussions) for anything that isn't a bug or feature request.
