"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ISBNInput } from "@/components/scanner/isbn-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { BookOpen, Camera, Keyboard, CheckCircle, AlertCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { normalizeISBN } from "@/lib/isbn-lookup";
import type { BookMetadata } from "@/lib/isbn-lookup";

const BarcodeScanner = dynamic(
  () => import("@/components/scanner/barcode-scanner").then(m => ({ default: m.BarcodeScanner })),
  { ssr: false, loading: () => <div className="h-64 bg-muted rounded-xl animate-pulse" /> }
);

// Full metadata stored in state — extends BookMetadata with the isbn field
type BookMeta = BookMetadata & { isbn: string };

interface SearchResult {
  title: string;
  author: string | null;
  isbn: string | null;
  coverUrl: string | null;
  year: number | null;
  publisher: string | null;
}

type Mode = "camera" | "manual" | "title";
type State = "idle" | "loading" | "found" | "notfound" | "searching" | "results";

export function ScanView() {
  const router = useRouter();
  const [mode,   setMode]   = useState<Mode>("camera");
  const [state,  setState]  = useState<State>("idle");
  const [saving, setSaving] = useState(false);
  const [meta,  setMeta]  = useState<BookMeta | null>(null);
  const [editTitle,     setEditTitle]     = useState("");
  const [editAuthor,    setEditAuthor]    = useState("");
  const [titleQuery,    setTitleQuery]    = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleScan = useCallback(async (isbn: string) => {
    if (state === "loading" || saving) return;
    setState("loading");
    setMeta(null);

    try {
      const res = await fetch(`/api/isbn/${isbn}`);
      if (res.ok) {
        const data = await res.json();
        setMeta(data);
        setEditTitle(data.title);
        setEditAuthor(data.author ?? "");
        setState("found");
      } else {
        setState("notfound");
        setMeta({ isbn, title: "", author: null, coverUrl: null, publisher: null, year: null, description: null, pageCount: null, subjects: null, language: null, firstPublishedYear: null, ratingsAverage: null, ratingsCount: null });
        setEditTitle("");
        setEditAuthor("");
      }
    } catch {
      setState("notfound");
    }
  }, [state]);

  async function addBook() {
    if (!meta) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...meta,
        title:  editTitle || meta.title,
        author: editAuthor || meta.author,
      };
      // Don't send an empty isbn string — Zod regex would reject it
      if (!payload.isbn) delete payload.isbn;

      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { toast.error("Failed to add book"); return; }
      const book = await res.json();
      toast.success(`"${editTitle || meta.title}" added to your library`);
      router.push(`/books/${book.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleTitleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!titleQuery.trim()) return;
    setState("searching");
    setSearchResults([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(titleQuery)}`);
      const data: SearchResult[] = await res.json();
      setSearchResults(data);
      setState("results");
    } catch {
      setState("results");
    }
  }

  async function pickResult(result: SearchResult) {
    if (result.isbn) {
      await handleScan(normalizeISBN(result.isbn));
    } else {
      setMeta({ isbn: "", title: result.title, author: result.author, coverUrl: result.coverUrl, publisher: result.publisher, year: result.year, description: null, pageCount: null, subjects: null, language: null, firstPublishedYear: result.year, ratingsAverage: null, ratingsCount: null });
      setEditTitle(result.title);
      setEditAuthor(result.author ?? "");
      setState("found");
    }
  }

  function reset() {
    setState("idle");
    setMeta(null);
    setTitleQuery("");
    setSearchResults([]);
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("camera"); reset(); }}
        >
          <Camera className="h-4 w-4 mr-2" /> Camera
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("manual"); reset(); }}
        >
          <Keyboard className="h-4 w-4 mr-2" /> Manual
        </Button>
        <Button
          variant={mode === "title" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("title"); reset(); }}
        >
          <Search className="h-4 w-4 mr-2" /> Title
        </Button>
      </div>

      {/* Scanner / input */}
      {state === "idle" && mode === "camera" && <BarcodeScanner onScan={handleScan} />}
      {state === "idle" && mode === "manual"  && <ISBNInput onScan={handleScan} />}
      {(state === "idle" || state === "searching" || state === "results") && mode === "title" && (
        <div className="space-y-4">
          <form onSubmit={handleTitleSearch} className="flex gap-2">
            <Input
              value={titleQuery}
              onChange={e => setTitleQuery(e.target.value)}
              placeholder="Search by title (e.g. Dune)"
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={state === "searching"}>
              {state === "searching" ? "Searching…" : "Search"}
            </Button>
          </form>

          {state === "searching" && (
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

          {state === "results" && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No results found. Try a different title.</p>
          )}

          {state === "results" && searchResults.length > 0 && (
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
        </div>
      )}

      {/* Loading */}
      {state === "loading" && (
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/2" />
          <div className="flex gap-4">
            <Skeleton className="w-24 h-36 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </div>
      )}

      {/* Not found */}
      {state === "notfound" && (
        <Card>
          <CardContent className="py-6 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No metadata found</p>
            <p className="text-sm text-muted-foreground">ISBN: <code className="font-mono">{meta?.isbn}</code></p>
            <div className="w-full space-y-2 mt-2">
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Enter title manually" />
              <Input value={editAuthor} onChange={e => setEditAuthor(e.target.value)} placeholder="Author (optional)" />
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={reset}>{mode === "title" ? "Search Again" : "Scan Again"}</Button>
              <Button onClick={addBook} disabled={!editTitle.trim()}>Add Anyway</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Found */}
      {state === "found" && meta && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex gap-4">
              <div className="relative w-24 h-36 shrink-0 rounded-lg overflow-hidden bg-muted">
                {meta.coverUrl ? (
                  <Image src={meta.coverUrl} alt={meta.title} fill className="object-cover" />
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
                  {meta.year      && <Badge variant="outline" className="text-xs">{meta.year}</Badge>}
                  {meta.publisher && <Badge variant="outline" className="text-xs truncate max-w-[140px]">{meta.publisher}</Badge>}
                  {meta.pageCount && <Badge variant="outline" className="text-xs">{meta.pageCount}p</Badge>}
                </div>
                <p className="text-xs text-muted-foreground font-mono">ISBN {meta.isbn}</p>
              </div>
            </div>
            {meta.description && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{meta.description}</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                {mode === "title" ? "Search Another" : "Scan Another"}
              </Button>
              <Button className="flex-1" onClick={addBook} disabled={!editTitle.trim() || saving}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {saving ? "Adding…" : "Add to Library"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
