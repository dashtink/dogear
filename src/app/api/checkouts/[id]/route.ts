import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { checkouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const [updated] = await db
    .update(checkouts)
    .set({ returnedAt: new Date() })
    .where(eq(checkouts.id, id))
    .returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
