import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { checkouts, books } from "@/db/schema";
import { CreateCheckoutSchema } from "@/lib/validations";
import { eq, isNull, isNotNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const history = req.nextUrl.searchParams.get("history") === "true";

  const rows = await db.query.checkouts.findMany({
    where: history ? undefined : isNull(checkouts.returnedAt),
    with: { book: true },
    orderBy: (c, { desc }) => [desc(c.checkedOutAt)],
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check no active checkout exists for this book
  const active = await db.query.checkouts.findFirst({
    where: (c) => eq(c.bookId, parsed.data.bookId),
  });
  const hasActive = active && active.returnedAt === null;
  if (hasActive) {
    return NextResponse.json(
      { error: "This book is already checked out" },
      { status: 409 }
    );
  }

  const [checkout] = await db.insert(checkouts).values(parsed.data).returning();
  return NextResponse.json(checkout, { status: 201 });
}
