import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { books, bookLocations, shelves, checkouts } from "@/db/schema";
import { CreateBookSchema } from "@/lib/validations";
import { fetchByISBN, normalizeISBN } from "@/lib/isbn-lookup";
import { ilike, or, eq, isNull, isNotNull, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q       = searchParams.get("q");
  const shelfId = searchParams.get("shelf");
  const genre   = searchParams.get("genre");
  const onLoan  = searchParams.get("on_loan");

  const conditions = [];
  if (q) conditions.push(or(ilike(books.title, `%${q}%`), ilike(books.author!, `%${q}%`)));
  if (genre) conditions.push(eq(books.genre!, genre));

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

  let result = rows;

  if (shelfId) {
    result = result.filter(b => b.location?.shelfId === parseInt(shelfId));
  }
  if (onLoan === "true") {
    result = result.filter(b => b.checkouts.length > 0);
  }

  return NextResponse.json(result);
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

  const [book] = await db.insert(books).values(parsed.data).returning();
  return NextResponse.json(book, { status: 201 });
}
