import { db } from "@/db";
import { books, checkouts } from "@/db/schema";
import { isNull, gte, count, sum, avg, eq, isNotNull } from "drizzle-orm";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatsSection } from "@/components/dashboard/stats-section";
import { BookCard } from "@/components/books/book-card";
import { Library, Users, AlertTriangle, CalendarPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalBooksRes,
    activeCheckouts,
    recentBooks,
    addedThisMonthRes,
    allBooks,
  ] = await Promise.all([
    db.select({ count: count() }).from(books),
    db.query.checkouts.findMany({
      where: isNull(checkouts.returnedAt),
      with: { book: true },
    }),
    db.query.books.findMany({
      limit: 8,
      orderBy: (b, { desc }) => [desc(b.addedAt)],
      with: {
        location: { with: { shelf: true } },
        checkouts: { where: isNull(checkouts.returnedAt), limit: 1 },
      },
    }),
    db.select({ count: count() }).from(books).where(gte(books.addedAt, monthStart)),
    db.query.books.findMany({ columns: { readStatus: true, pageCount: true, year: true, genre: true, title: true, addedAt: true, finishedAt: true } }),
  ]);

  const onLoan  = activeCheckouts.length;
  const overdue = activeCheckouts.filter(c => c.dueDate && new Date(c.dueDate) < now).length;

  // Reading stats
  const booksRead    = allBooks.filter(b => b.readStatus === "read").length;
  const booksReading = allBooks.filter(b => b.readStatus === "reading").length;

  const booksWithPages = allBooks.filter(b => b.pageCount && b.pageCount > 0);
  const totalPages = booksWithPages.reduce((s, b) => s + (b.pageCount ?? 0), 0);
  const avgPages   = booksWithPages.length ? Math.round(totalPages / booksWithPages.length) : 0;

  const booksWithYear = allBooks.filter(b => b.year && b.year > 0);
  const avgYear = booksWithYear.length
    ? Math.round(booksWithYear.reduce((s, b) => s + (b.year ?? 0), 0) / booksWithYear.length)
    : null;

  // Genre donut
  const genreMap: Record<string, number> = {};
  for (const b of allBooks) {
    if (b.genre) genreMap[b.genre] = (genreMap[b.genre] ?? 0) + 1;
  }
  const genreData = Object.entries(genreMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Books finished per year
  const yearMap: Record<string, number> = {};
  for (const b of allBooks.filter(b => b.readStatus === "read" && b.finishedAt)) {
    const yr = new Date(b.finishedAt!).getFullYear().toString();
    yearMap[yr] = (yearMap[yr] ?? 0) + 1;
  }
  const readByYear = Object.entries(yearMap)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));

  // Longest / shortest
  const sorted = [...booksWithPages].sort((a, b) => (b.pageCount ?? 0) - (a.pageCount ?? 0));
  const longestBook  = sorted.length ? { title: sorted[0].title, pageCount: sorted[0].pageCount! } : null;
  const shortestBook = sorted.length > 1 ? { title: sorted[sorted.length - 1].title, pageCount: sorted[sorted.length - 1].pageCount! } : null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your library at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Books"      value={totalBooksRes[0].count}    icon={Library} />
        <StatCard label="On Loan"          value={onLoan}                    icon={Users}         color="orange" />
        <StatCard label="Overdue"          value={overdue}                   icon={AlertTriangle} color="red" />
        <StatCard label="Added This Month" value={addedThisMonthRes[0].count} icon={CalendarPlus} color="green" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Reading Stats</h2>
        <StatsSection
          booksRead={booksRead}
          booksReading={booksReading}
          totalPages={totalPages}
          avgPages={avgPages}
          avgYear={avgYear}
          genreData={genreData}
          readByYear={readByYear}
          longestBook={longestBook}
          shortestBook={shortestBook}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recently Added</h2>
        {recentBooks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No books yet.{" "}
            <a href="/scan" className="underline text-primary">Scan your first book →</a>
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {recentBooks.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        )}
      </div>
    </div>
  );
}
