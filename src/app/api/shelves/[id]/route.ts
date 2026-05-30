import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shelves } from "@/db/schema";
import { CreateShelfSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const body = await req.json();
  const parsed = CreateShelfSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [updated] = await db.update(shelves).set(parsed.data).where(eq(shelves.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  await db.delete(shelves).where(eq(shelves.id, id));
  return new NextResponse(null, { status: 204 });
}
