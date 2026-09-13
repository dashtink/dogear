import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { books, bookLocations, shelves, checkouts } from "@/db/schema";
import { CreateBookSchema } from "@/lib/validations";
import { fetchByISBN, normalizeISBN } from "@/lib/isbn-lookup";
import { ilike, or, eq, isNull, isNotNull, and, inArray } from "drizzle-orm";

const VALID_STATUSES = ["unread", "reading", "read"] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q       = searchParams.get("q");
  const shelfId = searchParams.get("shelf");
  const genre   = searchParams.get("genre");
  const onLoan  = searchParams.get("on_loan");
  const status  = searchParams.get("status");

  if (status && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  const conditions = [];
  if (q) conditions.push(or(ilike(books.title, `%${q}%`), ilike(books.author!, `%${q}%`)));
  if (genre) conditions.push(eq(books.genre!, genre));
  if (status) conditions.push(eq(books.readStatus, status as "unread" | "reading" | "read"));

  if (shelfId) {
    const shelfIdNum = parseInt(shelfId);
    if (isNaN(shelfIdNum)) return NextResponse.json({ error: "Invalid shelf id" }, { status: 400 });
    conditions.push(
      inArray(
        books.id,
        db.select({ id: bookLocations.bookId }).from(bookLocations).where(eq(bookLocations.shelfId, shelfIdNum))
      )
    );
  }
  if (onLoan === "true") {
    conditions.push(
      inArray(
        books.id,
        db.select({ id: checkouts.bookId }).from(checkouts).where(isNull(checkouts.returnedAt))
      )
    );
  }

  const rows = await db.query.books.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: {
      location: { with: { shelf: true } },
      checkouts: {
        where: isNull(checkouts.returnedAt),
        limit: 1,
      },
    },
    orderBy: (b, { desc }) => [desc(b.addedAt)],
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // If only isbn provided, auto-fetch metadata
  if (body.isbn && !body.title) {
    const normalized = normalizeISBN(body.isbn);
    const meta = await fetchByISBN(normalized);
    if (!meta) {
      return NextResponse.json({ error: "Could not find book metadata for this ISBN" }, { status: 404 });
    }
    Object.assign(body, meta, { isbn: normalized });
  } else if (body.isbn) {
    body.isbn = normalizeISBN(body.isbn);
  }

  const parsed = CreateBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isbn) {
    const existing = await db.query.books.findFirst({ where: eq(books.isbn, parsed.data.isbn) });
    if (existing) {
      return NextResponse.json(
        { error: "A book with this ISBN is already in your library", existingBookId: existing.id },
        { status: 409 }
      );
    }
  }

  const [book] = await db.insert(books).values(parsed.data).returning();
  return NextResponse.json(book, { status: 201 });
}
