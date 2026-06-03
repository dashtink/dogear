import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { series } from "@/db/schema";
import { CreateSeriesSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const row = await db.query.series.findFirst({
    where: eq(series.id, id),
    with: {
      books: {
        orderBy: (b, { asc, sql }) => [sql`${b.seriesPosition} nulls last`],
        with: { location: { with: { shelf: true } }, checkouts: { limit: 1 } },
      },
    },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const body = await req.json();
  const parsed = CreateSeriesSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const [updated] = await db.update(series).set(parsed.data).where(eq(series.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.delete(series).where(eq(series.id, parseInt(params.id)));
  return new NextResponse(null, { status: 204 });
}
