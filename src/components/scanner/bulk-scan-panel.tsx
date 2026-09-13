"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, X, CheckCircle2, AlertCircle, Loader2, Copy } from "lucide-react";
import Image from "next/image";
import { normalizeISBN } from "@/lib/isbn-lookup";
import type { BookMetadata } from "@/lib/isbn-lookup";
import { toast } from "sonner";

type QueueStatus = "looking-up" | "found" | "duplicate" | "notfound" | "adding" | "added" | "error";

interface QueueItem {
  key: string;
  isbn: string;
  status: QueueStatus;
  meta: BookMetadata | null;
  title: string;   // editable — used directly for notfound items, prefilled from meta otherwise
  author: string;
  existingBookId?: number;
  errorMessage?: string;
}

interface Shelf { id: number; name: string; }

let keyCounter = 0;
function nextKey() { return `${Date.now()}-${keyCounter++}`; }

export function BulkScanPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [shelfId, setShelfId] = useState<string>("");
  const [addingAll, setAddingAll] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
    fetch("/api/shelves").then(r => r.json()).then(setShelves).catch(() => {});
  }, []);

  function refocus() {
    // Re-focus on the next tick so it survives the input's own blur/re-render cycle
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function submitScan() {
    const stripped = value.replace(/[-\s]/g, "");
    if (!/^\d{10}(\d{3})?$/.test(stripped)) {
      toast.error("Enter a valid 10 or 13 digit ISBN");
      refocus();
      return;
    }
    const isbn = normalizeISBN(stripped);
    setValue("");
    refocus();

    if (queue.some(item => item.isbn === isbn)) {
      toast.info(`${isbn} is already in this scan queue`);
      return;
    }

    const key = nextKey();
    setQueue(q => [{ key, isbn, status: "looking-up", meta: null, title: "", author: "" }, ...q]);

    try {
      const [metaRes, existingRes] = await Promise.all([
        fetch(`/api/isbn/${isbn}`),
        fetch(`/api/books?isbn=${isbn}`),
      ]);

      const existing: unknown[] = existingRes.ok ? await existingRes.json() : [];
      if (Array.isArray(existing) && existing.length > 0) {
        const existingBook = existing[0] as { id: number };
        setQueue(q => q.map(item => item.key === key
          ? { ...item, status: "duplicate", existingBookId: existingBook.id }
          : item));
        return;
      }

      if (metaRes.ok) {
        const meta: BookMetadata = await metaRes.json();
        setQueue(q => q.map(item => item.key === key
          ? { ...item, status: "found", meta, title: meta.title, author: meta.author ?? "" }
          : item));
      } else {
        setQueue(q => q.map(item => item.key === key ? { ...item, status: "notfound" } : item));
      }
    } catch {
      setQueue(q => q.map(item => item.key === key
        ? { ...item, status: "error", errorMessage: "Lookup failed" }
        : item));
    }
  }

  function removeItem(key: string) {
    setQueue(q => q.filter(item => item.key !== key));
  }

  function updateItemField(key: string, field: "title" | "author", val: string) {
    setQueue(q => q.map(item => item.key === key ? { ...item, [field]: val } : item));
  }

  const addableCount = queue.filter(i => (i.status === "found" || i.status === "notfound") && i.title.trim()).length;

  async function addAll() {
    setAddingAll(true);
    const targets = queue.filter(i => (i.status === "found" || i.status === "notfound") && i.title.trim());

    for (const item of targets) {
      setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "adding" } : i));
      try {
        const payload: Record<string, unknown> = {
          ...(item.meta ?? {}),
          isbn:   item.isbn,
          title:  item.title.trim(),
          author: item.author.trim() || null,
        };
        const res = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.status === 409) {
          setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "duplicate" } : i));
          continue;
        }
        if (!res.ok) {
          setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "error", errorMessage: "Failed to add" } : i));
          continue;
        }

        const book = await res.json();
        if (shelfId) {
          await fetch(`/api/books/${book.id}/location`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shelfId: parseInt(shelfId) }),
          }).catch(() => {});
        }
        setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "added" } : i));
      } catch {
        setQueue(q => q.map(i => i.key === item.key ? { ...i, status: "error", errorMessage: "Failed to add" } : i));
      }
    }

    setAddingAll(false);
    toast.success(`Added ${targets.length} book${targets.length !== 1 ? "s" : ""} to your library`);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={e => { e.preventDefault(); submitScan(); }} className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            // Handle Enter explicitly rather than relying only on native form-submit-on-Enter —
            // the underlying @base-ui input primitive doesn't reliably trigger it, and this
            // is the one interaction (hardware scanners emit Enter) the whole feature hinges on.
            if (e.key === "Enter") {
              e.preventDefault();
              submitScan();
            }
          }}
          placeholder="Scan or type an ISBN, then press Enter"
          className="font-mono flex-1"
          autoFocus
        />
        <Select value={shelfId || "none"} onValueChange={v => setShelfId(!v || v === "none" ? "" : v)}>
          <SelectTrigger className="w-40 shrink-0">
            <SelectValue placeholder="No shelf" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No shelf</SelectItem>
            {shelves.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </form>
      <p className="text-xs text-muted-foreground -mt-2">
        Point your barcode scanner at a book, or type an ISBN and press Enter. Keep scanning — the field stays ready for the next one.
      </p>

      {queue.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Scanned books will queue up here</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {queue.map(item => (
              <div key={item.key} className="flex gap-3 p-3 rounded-lg border bg-card">
                <div className="relative w-10 h-14 shrink-0 rounded overflow-hidden bg-muted">
                  {item.meta?.coverUrl ? (
                    <Image src={item.meta.coverUrl} alt={item.title} fill className="object-cover" sizes="40px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {item.status === "looking-up"
                        ? <Loader2 className="h-4 w-4 text-muted-foreground/50 animate-spin" />
                        : <BookOpen className="h-4 w-4 text-muted-foreground/40" />}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  {item.status === "notfound" ? (
                    <div className="space-y-1.5">
                      <Input
                        value={item.title}
                        onChange={e => updateItemField(item.key, "title", e.target.value)}
                        placeholder="Enter title manually"
                        className="h-7 text-sm"
                      />
                      <Input
                        value={item.author}
                        onChange={e => updateItemField(item.key, "author", e.target.value)}
                        placeholder="Author (optional)"
                        className="h-7 text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-sm leading-tight truncate">
                        {item.status === "looking-up" ? item.isbn : (item.title || item.isbn)}
                      </p>
                      {item.author && <p className="text-xs text-muted-foreground">{item.author}</p>}
                    </>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.status === "looking-up" && <Badge variant="outline" className="text-xs">Looking up…</Badge>}
                    {item.status === "found" && <Badge variant="outline" className="text-xs">Ready to add</Badge>}
                    {item.status === "notfound" && <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">No metadata found</Badge>}
                    {item.status === "duplicate" && (
                      <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 gap-1">
                        <Copy className="h-3 w-3" /> Already owned
                      </Badge>
                    )}
                    {item.status === "adding" && <Badge variant="outline" className="text-xs gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Adding…</Badge>}
                    {item.status === "added" && <Badge className="text-xs bg-green-100 text-green-700 border-green-300 gap-1"><CheckCircle2 className="h-3 w-3" /> Added</Badge>}
                    {item.status === "error" && <Badge variant="outline" className="text-xs text-destructive border-destructive gap-1"><AlertCircle className="h-3 w-3" /> {item.errorMessage ?? "Error"}</Badge>}
                  </div>
                </div>

                {(item.status !== "adding" && item.status !== "added") && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeItem(item.key)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={addAll} disabled={addableCount === 0 || addingAll}>
            {addingAll ? "Adding…" : `Add All to Library (${addableCount})`}
          </Button>
        </>
      )}
    </div>
  );
}
