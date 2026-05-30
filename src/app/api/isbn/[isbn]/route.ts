import { NextRequest, NextResponse } from "next/server";
import { fetchByISBN, normalizeISBN } from "@/lib/isbn-lookup";

export async function GET(_req: NextRequest, { params }: { params: { isbn: string } }) {
  const isbn = normalizeISBN(params.isbn);
  const meta = await fetchByISBN(isbn);
  if (!meta) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...meta, isbn });
}
