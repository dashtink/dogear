"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { BookCard } from "@/components/books/book-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

interface Shelf { id: number; name: string; }

export function LibraryView() {
  const router     = useRouter();
  const pathname   = usePathname();
  const params     = useSearchParams();

  const [books,       setBooks]       = useState<any[]>([]);
  const [shelves,     setShelves]     = useState<Shelf[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");

  const q       = params.get("q") ?? "";
  const shelf   = params.get("shelf") ?? "";
  const onLoan  = params.get("on_loan") === "true";

  function updateParam(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`);
  }

  const debouncedSearch = useDebouncedCallback((val: string) => updateParam("q", val || null), 300);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q)      p.set("q", q);
    if (shelf)  p.set("shelf", shelf);
    if (onLoan) p.set("on_loan", "true");
    const res = await fetch(`/api/books?${p.toString()}`);
    setBooks(await res.json());
    setLoading(false);
  }, [q, shelf, onLoan]);

  useEffect(() => { loadBooks(); }, [loadBooks]);
  useEffect(() => { fetch("/api/shelves").then(r => r.json()).then(setShelves); }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); debouncedSearch(e.target.value); }}
            placeholder="Search title or author…"
            className="pl-9"
          />
        </div>
        <Select value={shelf || "all"} onValueChange={v => updateParam("shelf", v === "all" ? null : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All shelves" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All shelves</SelectItem>
            {shelves.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <button
          onClick={() => updateParam("on_loan", onLoan ? null : "true")}
          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
            onLoan ? "bg-orange-100 border-orange-300 text-orange-700" : "bg-background border-border text-muted-foreground hover:bg-accent"
          }`}
        >
          On Loan
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No books found</p>
          <p className="text-sm mt-1">Try adjusting your filters or <a href="/scan" className="underline text-primary">scan a new book</a></p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{books.length} book{books.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {books.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </>
      )}
    </div>
  );
}
