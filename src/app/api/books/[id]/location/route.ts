import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookLocations } from "@/db/schema";
import { AssignLocationSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const bookId = parseInt(params.id);
  const body = await req.json();
  const parsed = AssignLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Upsert: delete existing then insert
  await db.delete(bookLocations).where(eq(bookLocations.bookId, bookId));
  const [location] = await db.insert(bookLocations).values({ bookId, ...parsed.data }).returning();
  return NextResponse.json(location);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const bookId = parseInt(params.id);
  await db.delete(bookLocations).where(eq(bookLocations.bookId, bookId));
  return new NextResponse(null, { status: 204 });
}
