import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  try {
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(q)}&limit=10&fields=key,title,author_name,isbn,cover_i,first_publish_year,publisher`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();

    const results = (data.docs ?? []).map((doc: {
      title?: string;
      author_name?: string[];
      isbn?: string[];
      cover_i?: number;
      first_publish_year?: number;
      publisher?: string[];
    }) => ({
      title:     doc.title ?? "",
      author:    doc.author_name?.[0] ?? null,
      isbn:      doc.isbn?.[0] ?? null,
      coverUrl:  doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      year:      doc.first_publish_year ?? null,
      publisher: doc.publisher?.[0] ?? null,
    }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
