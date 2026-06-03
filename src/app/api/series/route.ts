import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { series } from "@/db/schema";
import { CreateSeriesSchema } from "@/lib/validations";

export async function GET() {
  const rows = await db.query.series.findMany({
    orderBy: (s, { asc }) => [asc(s.name)],
    with: { books: { columns: { id: true, coverUrl: true, seriesPosition: true } } },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateSeriesSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const [created] = await db.insert(series).values(parsed.data).returning();
  return NextResponse.json(created, { status: 201 });
}
