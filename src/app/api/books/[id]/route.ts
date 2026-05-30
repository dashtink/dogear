import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { books, checkouts } from "@/db/schema";
import { UpdateBookSchema } from "@/lib/validations";
import { eq, isNull } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const book = await db.query.books.findFirst({
    where: eq(books.id, id),
    with: {
      location: { with: { shelf: true } },
      checkouts: { orderBy: (c, { desc }) => [desc(c.checkedOutAt)] },
    },
  });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(book);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const body = await req.json();
  const parsed = UpdateBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [updated] = await db.update(books).set(parsed.data).where(eq(books.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  await db.delete(books).where(eq(books.id, id));
  return new NextResponse(null, { status: 204 });
}
