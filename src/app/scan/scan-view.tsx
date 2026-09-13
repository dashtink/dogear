"use client";

import { useState } from "react";
import { BulkScanPanel } from "@/components/scanner/bulk-scan-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { BookOpen, ScanLine, Search, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { normalizeISBN } from "@/lib/isbn-lookup";

interface SearchResult {
  title: string;
  author: string | null;
  isbn: string | null;
  coverUrl: string | null;
  year: number | null;
  publisher: string | null;
}

type Mode = "scan" | "title";
type TitleState = "idle" | "searching" | "results" | "picked";

export function ScanView() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("scan");

  // Title-search flow (single book at a time — separate from the bulk scan queue)
  const [titleState,   setTitleState]   = useState<TitleState>("idle");
  const [titleQuery,    setTitleQuery]    = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [picked,        setPicked]        = useState<SearchResult | null>(null);
  const [editTitle,     setEditTitle]     = useState("");
  const [editAuthor,    setEditAuthor]    = useState("");
  const [saving,        setSaving]        = useState(false);

  async function handleTitleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!titleQuery.trim()) return;
    setTitleState("searching");
    setSearchResults([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(titleQuery)}`);
      const data: SearchResult[] = await res.json();
      setSearchResults(data);
      setTitleState("results");
    } catch {
      setTitleState("results");
    }
  }

  function pickResult(result: SearchResult) {
    setPicked(result);
    setEditTitle(result.title);
    setEditAuthor(result.author ?? "");
    setTitleState("picked");
  }

  function resetTitleSearch() {
    setTitleState("idle");
    setTitleQuery("");
    setSearchResults([]);
    setPicked(null);
  }

  async function addPickedBook() {
    if (!picked) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title:     editTitle || picked.title,
        author:    editAuthor || picked.author,
        isbn:      picked.isbn ? normalizeISBN(picked.isbn) : undefined,
        coverUrl:  picked.coverUrl,
        publisher: picked.publisher,
        year:      picked.year,
      };
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 409) { toast.error("This book is already in your library"); return; }
      if (!res.ok) { toast.error("Failed to add book"); return; }
      const book = await res.json();
      toast.success(`"${editTitle || picked.title}" added to your library`);
      router.push(`/books/${book.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button variant={mode === "scan" ? "default" : "outline"} size="sm" onClick={() => setMode("scan")}>
          <ScanLine className="h-4 w-4 mr-2" /> Scan
        </Button>
        <Button variant={mode === "title" ? "default" : "outline"} size="sm" onClick={() => { setMode("title"); resetTitleSearch(); }}>
          <Search className="h-4 w-4 mr-2" /> Title Search
        </Button>
      </div>

      {mode === "scan" && <BulkScanPanel />}

      {mode === "title" && (
        <div className="space-y-4">
          {titleState !== "picked" && (
            <form onSubmit={handleTitleSearch} className="flex gap-2">
              <Input
                value={titleQuery}
                onChange={e => setTitleQuery(e.target.value)}
                placeholder="Search by title (e.g. Dune)"
                className="flex-1"
                autoFocus
              />
              <Button type="submit" disabled={titleState === "searching"}>
                {titleState === "searching" ? "Searching…" : "Search"}
              </Button>
            </form>
          )}

          {titleState === "searching" && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg border">
                  <Skeleton className="w-10 h-14 rounded shrink-0" />
                  <div className="flex-1 space-y-1.5 py-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {titleState === "results" && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No results found. Try a different title.</p>
          )}

          {titleState === "results" && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pickResult(r)}
                  className="w-full flex gap-3 p-3 rounded-lg border hover:bg-accent text-left transition-colors"
                >
                  <div className="relative w-10 h-14 shrink-0 rounded overflow-hidden bg-muted">
                    {r.coverUrl ? (
                      <Image src={r.coverUrl} alt={r.title} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">{r.title}</p>
                    {r.author && <p className="text-xs text-muted-foreground mt-0.5">{r.author}</p>}
                    <div className="flex gap-1.5 mt-1">
                      {r.year && <Badge variant="outline" className="text-xs px-1 py-0">{r.year}</Badge>}
                      {r.publisher && <Badge variant="outline" className="text-xs px-1 py-0 truncate max-w-[140px]">{r.publisher}</Badge>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {titleState === "picked" && picked && (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex gap-4">
                  <div className="relative w-24 h-36 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {picked.coverUrl ? (
                      <Image src={picked.coverUrl} alt={picked.title} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="font-semibold" placeholder="Title" />
                    <Input value={editAuthor} onChange={e => setEditAuthor(e.target.value)} placeholder="Author" />
                    <div className="flex flex-wrap gap-1.5">
                      {picked.year      && <Badge variant="outline" className="text-xs">{picked.year}</Badge>}
                      {picked.publisher && <Badge variant="outline" className="text-xs truncate max-w-[140px]">{picked.publisher}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={resetTitleSearch}>Search Another</Button>
                  <Button className="flex-1" onClick={addPickedBook} disabled={!editTitle.trim() || saving}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {saving ? "Adding…" : "Add to Library"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
