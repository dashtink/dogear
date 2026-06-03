"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShelfAssignDialog } from "@/components/shelves/shelf-assign-dialog";
import { CheckoutForm } from "@/components/checkouts/checkout-form";
import { MapPin, BookUser, RotateCcw, Trash2, BookOpen, BookCheck, Bookmark, Layers } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ReadStatus = "unread" | "reading" | "read";

interface Props {
  book: { id: number; title: string };
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
  const [readStatus,   setReadStatus]   = useState<ReadStatus>(initialStatus);
  const [allSeries,    setAllSeries]    = useState<{ id: number; name: string }[]>([]);
  const [seriesId,     setSeriesId]     = useState<number | null>(initialSeriesId ?? null);
  const [seriesPos,    setSeriesPos]    = useState<string>(initialSeriesPos?.toString() ?? "");

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
