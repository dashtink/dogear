import { db } from "@/db";
import { isNull } from "drizzle-orm";
import { checkouts } from "@/db/schema";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Plus } from "lucide-react";
import { SeriesActions } from "./series-actions";

export const dynamic = "force-dynamic";

export default async function SeriesPage() {
  const allSeries = await db.query.series.findMany({
    orderBy: (s, { asc }) => [asc(s.name)],
    with: {
      books: {
        orderBy: (b, { sql }) => [sql`${b.seriesPosition} nulls last`],
        columns: { id: true, coverUrl: true, seriesPosition: true, title: true },
      },
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Series</h1>
          <p className="text-muted-foreground text-sm mt-1">Book series in your library</p>
        </div>
        <SeriesActions />
      </div>

      {allSeries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No series yet</p>
          <p className="text-sm mt-1">Create a series and assign books to it from the book detail page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allSeries.map(s => {
            const owned = s.books.length;
            const total = s.totalBooks ?? null;
            const covers = s.books.slice(0, 3).map(b => b.coverUrl).filter(Boolean);

            return (
              <Link key={s.id} href={`/series/${s.id}`} className="block">
                <div className="rounded-xl border bg-card hover:shadow-md transition-shadow p-4 space-y-3">
                  {/* Cover collage */}
                  <div className="flex gap-1.5 h-24">
                    {covers.length > 0 ? (
                      covers.map((url, i) => (
                        <div key={i} className="relative flex-1 rounded-md overflow-hidden bg-muted">
                          <Image src={url!} alt="" fill className="object-cover" sizes="80px" />
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 rounded-md bg-muted flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Placeholders for missing books */}
                    {total && total > owned && Array.from({ length: Math.min(3 - covers.length, total - owned) }).map((_, i) => (
                      <div key={`ph-${i}`} className="flex-1 rounded-md border-2 border-dashed border-muted-foreground/20 bg-muted/30" />
                    ))}
                  </div>

                  <div>
                    <p className="font-semibold leading-tight line-clamp-1">{s.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {owned} owned{total ? ` / ${total} total` : ""}
                      {total && owned < total ? (
                        <span className="ml-2 text-amber-600 font-medium">missing {total - owned}</span>
                      ) : total && owned === total ? (
                        <span className="ml-2 text-green-600 font-medium">complete</span>
                      ) : null}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
