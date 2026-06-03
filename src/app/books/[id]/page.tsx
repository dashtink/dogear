import { notFound } from "next/navigation";
import { db } from "@/db";
import { books, checkouts } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import Image from "next/image";
import { BookOpen, MapPin, ArrowLeft, Calendar, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookDetailActions } from "./book-detail-actions";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const book = await db.query.books.findFirst({
    where: eq(books.id, id),
    with: {
      location: { with: { shelf: true } },
      checkouts: { orderBy: (c, { desc }) => [desc(c.checkedOutAt)] },
    },
  });

  if (!book) notFound();

  const activeCheckout = book.checkouts.find(c => !c.returnedAt);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Library
      </Link>

      <div className="flex flex-col sm:flex-row gap-8">
        {/* Cover */}
        <div className="relative w-40 h-60 shrink-0 rounded-xl overflow-hidden bg-muted self-start">
          {book.coverUrl ? (
            <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-14 w-14 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight">{book.title}</h1>
            {book.author && <p className="text-muted-foreground mt-1">{book.author}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {book.year      && <Badge variant="outline">{book.year}</Badge>}
              {book.firstPublishedYear && book.firstPublishedYear !== book.year && (
                <Badge variant="outline" className="text-muted-foreground">First pub. {book.firstPublishedYear}</Badge>
              )}
              {book.genre     && <Badge variant="outline">{book.genre}</Badge>}
              {book.publisher && <Badge variant="outline">{book.publisher}</Badge>}
              {book.pageCount && <Badge variant="outline">{book.pageCount} pages</Badge>}
              {book.language  && <Badge variant="outline" className="uppercase">{book.language}</Badge>}
              {book.isbn      && <Badge variant="outline" className="font-mono text-xs">ISBN {book.isbn}</Badge>}
            </div>

            {/* Ratings */}
            {book.ratingsAverage && (
              <div className="flex items-center gap-1.5 mt-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{book.ratingsAverage}</span>
                {book.ratingsCount && (
                  <span className="text-xs text-muted-foreground">({book.ratingsCount.toLocaleString()} ratings on OpenLibrary)</span>
                )}
              </div>
            )}
          </div>

          {book.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Summary</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
            </div>
          )}

          {/* Subjects */}
          {book.subjects && (() => {
            try {
              const tags: string[] = JSON.parse(book.subjects);
              return tags.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                </div>
              ) : null;
            } catch { return null; }
          })()}

          {/* Date added */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Added {format(new Date(book.addedAt), "PPP")}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {book.location?.shelf ? (
              <span>
                <span className="font-medium">{book.location.shelf.name}</span>
                {book.location.row && ` · Row ${book.location.row}`}
                {book.location.position && ` · Position ${book.location.position}`}
              </span>
            ) : (
              <span className="text-muted-foreground">No shelf assigned</span>
            )}
          </div>

          {/* Active checkout banner */}
          {activeCheckout && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-orange-700">Currently on loan</p>
              <p className="text-orange-600 mt-0.5">
                Borrowed by <strong>{activeCheckout.borrowerName}</strong>
                {activeCheckout.dueDate && ` · Due ${format(new Date(activeCheckout.dueDate), "PPP")}`}
              </p>
            </div>
          )}

          <BookDetailActions
            book={{ id: book.id, title: book.title }}
            location={book.location?.shelfId ? { shelfId: book.location.shelfId, row: book.location.row, position: book.location.position } : null}
            activeCheckout={activeCheckout ?? null}
            readStatus={(book.readStatus ?? "unread") as "unread" | "reading" | "read"}
            seriesId={book.seriesId}
            seriesPosition={book.seriesPosition}
          />
        </div>
      </div>

      {/* Checkout history */}
      {book.checkouts.length > 0 && (
        <>
          <Separator className="my-8" />
          <div>
            <h2 className="text-lg font-semibold mb-4">Checkout History</h2>
            <div className="space-y-2">
              {book.checkouts.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 text-sm">
                  <div>
                    <span className="font-medium">{c.borrowerName}</span>
                    {c.borrowerContact && <span className="text-muted-foreground ml-2">· {c.borrowerContact}</span>}
                  </div>
                  <div className="text-right text-muted-foreground">
                    <p>{format(new Date(c.checkedOutAt), "PP")}</p>
                    {c.returnedAt && <p className="text-green-600">Returned {format(new Date(c.returnedAt), "PP")}</p>}
                    {!c.returnedAt && <Badge variant="secondary" className="bg-orange-100 text-orange-700">Out</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
