import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shelves, bookLocations } from "@/db/schema";
import { CreateShelfSchema } from "@/lib/validations";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id:          shelves.id,
      name:        shelves.name,
      description: shelves.description,
      bookCount:   sql<number>`count(${bookLocations.id})`.mapWith(Number),
    })
    .from(shelves)
    .leftJoin(bookLocations, eq(bookLocations.shelfId, shelves.id))
    .groupBy(shelves.id)
    .orderBy(shelves.name);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateShelfSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [shelf] = await db.insert(shelves).values(parsed.data).returning();
  return NextResponse.json(shelf, { status: 201 });
}
