"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShelfAssignDialog } from "@/components/shelves/shelf-assign-dialog";
import { CheckoutForm } from "@/components/checkouts/checkout-form";
import { MapPin, BookUser, RotateCcw, Trash2, BookOpen, BookCheck, Bookmark, Layers, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ReadStatus = "unread" | "reading" | "read";

interface BookFields {
  id: number;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  year?: number | null;
  genre?: string | null;
  publisher?: string | null;
  description?: string | null;
  pageCount?: number | null;
}

interface Props {
  book: BookFields;
  location?: { shelfId: number; row?: string | null; position?: number | null } | null;
  activeCheckout: { id: number } | null;
  readStatus: ReadStatus;
  seriesId?: number | null;
  seriesPosition?: number | null;
}

const statusConfig: Record<ReadStatus, { label: string; icon: React.ElementType; active: string }> = {
  unread:  { label: "Unread",  icon: Bookmark,  active: "bg-secondary text-secondary-foreground" },
  reading: { label: "Reading", icon: BookOpen,  active: "bg-amber-100 text-amber-700 border-amber-300" },
  read:    { label: "Read",    icon: BookCheck, active: "bg-green-100 text-green-700 border-green-300" },
};

export function BookDetailActions({ book, location, activeCheckout, readStatus: initialStatus, seriesId: initialSeriesId, seriesPosition: initialSeriesPos }: Props) {
  const router = useRouter();
  const [shelfOpen,    setShelfOpen]    = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [seriesOpen,   setSeriesOpen]   = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const [readStatus,   setReadStatus]   = useState<ReadStatus>(initialStatus);
  const [allSeries,    setAllSeries]    = useState<{ id: number; name: string }[]>([]);
  const [seriesId,     setSeriesId]     = useState<number | null>(initialSeriesId ?? null);
  const [seriesPos,    setSeriesPos]    = useState<string>(initialSeriesPos?.toString() ?? "");

  // Edit form state
  const [editTitle,       setEditTitle]       = useState(book.title);
  const [editAuthor,      setEditAuthor]      = useState(book.author ?? "");
  const [editCoverUrl,    setEditCoverUrl]    = useState(book.coverUrl ?? "");
  const [editYear,        setEditYear]        = useState(book.year?.toString() ?? "");
  const [editGenre,       setEditGenre]       = useState(book.genre ?? "");
  const [editPublisher,   setEditPublisher]   = useState(book.publisher ?? "");
  const [editDescription, setEditDescription] = useState(book.description ?? "");
  const [editPageCount,   setEditPageCount]   = useState(book.pageCount?.toString() ?? "");
  const [editSaving,      setEditSaving]      = useState(false);

  async function updateStatus(status: ReadStatus) {
    setReadStatus(status);
    const now = new Date().toISOString();
    await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        readStatus: status,
        startedAt:  status === "reading" || status === "read" ? now : null,
        finishedAt: status === "read" ? now : null,
      }),
    });
    router.refresh();
  }

  async function returnBook() {
    if (!activeCheckout) return;
    await fetch(`/api/checkouts/${activeCheckout.id}`, { method: "PATCH" });
    toast.success("Book marked as returned");
    router.refresh();
  }

  async function openSeriesDialog() {
    if (allSeries.length === 0) {
      const rows = await fetch("/api/series").then(r => r.json());
      setAllSeries(rows);
    }
    setSeriesOpen(true);
  }

  async function saveSeries() {
    await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seriesId: seriesId ?? null,
        seriesPosition: seriesPos ? parseInt(seriesPos) : null,
      }),
    });
    setSeriesOpen(false);
    router.refresh();
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       editTitle.trim(),
          author:      editAuthor.trim()      || null,
          coverUrl:    editCoverUrl.trim()    || null,
          year:        editYear               ? parseInt(editYear)       : null,
          genre:       editGenre.trim()       || null,
          publisher:   editPublisher.trim()   || null,
          description: editDescription.trim() || null,
          pageCount:   editPageCount          ? parseInt(editPageCount)  : null,
        }),
      });
      if (!res.ok) { toast.error("Failed to save changes"); return; }
      toast.success("Book updated");
      setEditOpen(false);
      router.refresh();
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteBook() {
    if (!confirm("Delete this book from your library?")) return;
    await fetch(`/api/books/${book.id}`, { method: "DELETE" });
    toast.success("Book deleted");
    router.push("/library");
  }

  return (
    <>
      {/* Reading status toggle */}
      <div className="flex gap-1.5 pt-2">
        {(Object.keys(statusConfig) as ReadStatus[]).map(status => {
          const { label, icon: Icon, active } = statusConfig[status];
          const isActive = readStatus === status;
          return (
            <button
              key={status}
              onClick={() => updateStatus(status)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                isActive ? active : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => setShelfOpen(true)}>
          <MapPin className="h-4 w-4 mr-2" />
          {location ? "Change Shelf" : "Assign Shelf"}
        </Button>

        <Button variant="outline" size="sm" onClick={openSeriesDialog}>
          <Layers className="h-4 w-4 mr-2" />
          {seriesId ? "Change Series" : "Add to Series"}
        </Button>

        {activeCheckout ? (
          <Button variant="outline" size="sm" onClick={returnBook}>
            <RotateCcw className="h-4 w-4 mr-2" /> Mark Returned
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setCheckoutOpen(true)}>
            <BookUser className="h-4 w-4 mr-2" /> Check Out
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4 mr-2" /> Edit
        </Button>

        <Button variant="ghost" size="sm" onClick={deleteBook} className="text-destructive hover:text-destructive ml-auto">
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
      </div>

      <ShelfAssignDialog
        bookId={book.id}
        current={location}
        open={shelfOpen}
        onClose={() => setShelfOpen(false)}
        onSaved={() => router.refresh()}
      />
      <CheckoutForm
        bookId={book.id}
        title={book.title}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSaved={() => router.refresh()}
      />

      {/* Edit book dialog */}
      <Dialog open={editOpen} onOpenChange={v => !v && setEditOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Book</DialogTitle></DialogHeader>
          <form onSubmit={saveEdit} className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title *</label>
              <Input required value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Author</label>
              <Input value={editAuthor} onChange={e => setEditAuthor(e.target.value)} placeholder="Author" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cover Image URL</label>
              <Input value={editCoverUrl} onChange={e => setEditCoverUrl(e.target.value)} placeholder="https://…" />
              {editCoverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editCoverUrl} alt="Cover preview" className="h-24 w-16 object-cover rounded-md mt-1 border" onError={e => (e.currentTarget.style.display = "none")} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year</label>
                <Input type="number" min={1000} max={2100} value={editYear} onChange={e => setEditYear(e.target.value)} placeholder="2024" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pages</label>
                <Input type="number" min={1} value={editPageCount} onChange={e => setEditPageCount(e.target.value)} placeholder="320" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Genre</label>
                <Input value={editGenre} onChange={e => setEditGenre(e.target.value)} placeholder="Fiction" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Publisher</label>
                <Input value={editPublisher} onChange={e => setEditPublisher(e.target.value)} placeholder="Publisher" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
              <Textarea rows={4} value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Summary…" className="resize-none" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={editSaving || !editTitle.trim()}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Series dialog */}
      <Dialog open={seriesOpen} onOpenChange={v => !v && setSeriesOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign to Series</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={(seriesId != null ? seriesId.toString() : "none")} onValueChange={(v: string | null) => { setSeriesId(!v || v === "none" ? null : parseInt(v)); }}>
              <SelectTrigger><SelectValue placeholder="Select series" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {allSeries.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {seriesId && (
              <Input
                type="number"
                min={1}
                value={seriesPos}
                onChange={e => setSeriesPos(e.target.value)}
                placeholder="Position in series (e.g. 1, 2, 3…)"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeriesOpen(false)}>Cancel</Button>
            <Button onClick={saveSeries}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
