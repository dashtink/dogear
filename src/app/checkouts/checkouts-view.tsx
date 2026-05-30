"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Checkout {
  id: number;
  borrowerName: string;
  borrowerContact?: string | null;
  checkedOutAt: string;
  dueDate?: string | null;
  returnedAt?: string | null;
  book: { id: number; title: string; author?: string | null };
}

export function CheckoutsView() {
  const [active,  setActive]  = useState<Checkout[]>([]);
  const [history, setHistory] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [a, h] = await Promise.all([
      fetch("/api/checkouts").then(r => r.json()),
      fetch("/api/checkouts?history=true").then(r => r.json()),
    ]);
    setActive(a);
    setHistory(h);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markReturned(id: number) {
    await fetch(`/api/checkouts/${id}`, { method: "PATCH" });
    toast.success("Marked as returned");
    load();
  }

  const now = new Date();

  return (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">
          Active{active.length > 0 && <Badge variant="secondary" className="ml-2">{active.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="mt-4">
        {loading ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>
        ) : active.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No books currently on loan.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Checked Out</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.map(c => {
                const overdue = c.dueDate && new Date(c.dueDate) < now;
                return (
                  <TableRow key={c.id} className={overdue ? "bg-red-50/50" : undefined}>
                    <TableCell>
                      <Link href={`/books/${c.book.id}`} className="font-medium hover:underline">
                        {c.book.title}
                      </Link>
                      {c.book.author && <p className="text-xs text-muted-foreground">{c.book.author}</p>}
                    </TableCell>
                    <TableCell>
                      <p>{c.borrowerName}</p>
                      {c.borrowerContact && <p className="text-xs text-muted-foreground">{c.borrowerContact}</p>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(c.checkedOutAt), "PP")}
                    </TableCell>
                    <TableCell>
                      {c.dueDate ? (
                        <span className={overdue ? "text-red-600 font-medium text-sm" : "text-sm"}>
                          {format(new Date(c.dueDate), "PP")}
                          {overdue && <span className="block text-xs">Overdue</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => markReturned(c.id)}>
                        <RotateCcw className="h-4 w-4 mr-2" /> Return
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No checkout history yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Checked Out</TableHead>
                <TableHead>Returned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/books/${c.book.id}`} className="font-medium hover:underline">
                      {c.book.title}
                    </Link>
                  </TableCell>
                  <TableCell>{c.borrowerName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(c.checkedOutAt), "PP")}</TableCell>
                  <TableCell className="text-sm">
                    {c.returnedAt ? (
                      <span className="text-green-600">{format(new Date(c.returnedAt), "PP")}</span>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">Out</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  );
}
