import { notFound } from "next/navigation";
import { db } from "@/db";
import { series, checkouts } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SeriesDetailActions } from "./series-detail-actions";

export const dynamic = "force-dynamic";

export default async function SeriesDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const s = await db.query.series.findFirst({
    where: eq(series.id, id),
    with: {
      books: {
        orderBy: (b, { sql }) => [sql`${b.seriesPosition} nulls last`],
        with: {
          location: { with: { shelf: true } },
          checkouts: { where: isNull(checkouts.returnedAt), limit: 1 },
        },
      },
    },
  });
  if (!s) notFound();

  const owned = s.books.length;
  const total = s.totalBooks;
  const missing = total ? total - owned : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/series" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Series
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{s.name}</h1>
          {s.description && <p className="text-muted-foreground text-sm mt-1">{s.description}</p>}
          <p className="text-sm mt-2">
            <span className="font-medium">{owned}</span> owned
            {total ? <> / <span className="font-medium">{total}</span> total</> : ""}
            {missing > 0 && <span className="ml-2 text-amber-600 font-medium">{missing} missing</span>}
            {total && owned === total && <span className="ml-2 text-green-600 font-medium">complete!</span>}
          </p>
        </div>
        <SeriesDetailActions seriesId={id} name={s.name} totalBooks={s.totalBooks} description={s.description} />
      </div>

      {/* Book list */}
      <div className="space-y-2">
        {/* Owned books */}
        {s.books.map(book => (
          <Link key={book.id} href={`/books/${book.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:shadow-sm transition-shadow">
            <div className="relative w-10 h-14 shrink-0 rounded bg-muted overflow-hidden">
              {book.coverUrl ? (
                <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="40px" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-tight line-clamp-1">{book.title}</p>
              {book.seriesPosition && (
                <p className="text-xs text-muted-foreground mt-0.5">#{book.seriesPosition}</p>
              )}
            </div>
            {book.checkouts.length > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs shrink-0">On Loan</Badge>
            )}
          </Link>
        ))}

        {/* Missing placeholders */}
        {missing > 0 && Array.from({ length: Math.min(missing, 20) }).map((_, i) => {
          const position = owned + i + 1;
          return (
            <div key={`missing-${i}`} className="flex items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-3">
              <div className="w-10 h-14 shrink-0 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Book #{position}</p>
                <p className="text-xs text-muted-foreground/60">Not in library</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
