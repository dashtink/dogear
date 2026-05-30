import { db } from "@/db";
import { books, checkouts } from "@/db/schema";
import { isNull, gte, count } from "drizzle-orm";
import { StatCard } from "@/components/dashboard/stat-card";
import { BookCard } from "@/components/books/book-card";
import { Library, Users, AlertTriangle, CalendarPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now      = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalBooks, activeCheckouts, recentBooks, addedThisMonth] = await Promise.all([
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
  ]);

  const onLoan  = activeCheckouts.length;
  const overdue = activeCheckouts.filter(c => c.dueDate && new Date(c.dueDate) < now).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your library at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Books"      value={totalBooks[0].count}      icon={Library} />
        <StatCard label="On Loan"          value={onLoan}                   icon={Users}        color="orange" />
        <StatCard label="Overdue"          value={overdue}                  icon={AlertTriangle} color="red" />
        <StatCard label="Added This Month" value={addedThisMonth[0].count}  icon={CalendarPlus}  color="green" />
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
