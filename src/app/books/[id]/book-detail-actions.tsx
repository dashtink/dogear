"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShelfAssignDialog } from "@/components/shelves/shelf-assign-dialog";
import { CheckoutForm } from "@/components/checkouts/checkout-form";
import { MapPin, BookUser, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  book: { id: number; title: string };
  location?: { shelfId: number; row?: string | null; position?: number | null } | null;
  activeCheckout: { id: number } | null;
}

export function BookDetailActions({ book, location, activeCheckout }: Props) {
  const router = useRouter();
  const [shelfOpen,    setShelfOpen]    = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  async function returnBook() {
    if (!activeCheckout) return;
    await fetch(`/api/checkouts/${activeCheckout.id}`, { method: "PATCH" });
    toast.success("Book marked as returned");
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
      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => setShelfOpen(true)}>
          <MapPin className="h-4 w-4 mr-2" />
          {location ? "Change Shelf" : "Assign Shelf"}
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
    </>
  );
}
