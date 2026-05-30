"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CheckoutFormProps {
  bookId:  number;
  title:   string;
  open:    boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CheckoutForm({ bookId, title, open, onClose, onSaved }: CheckoutFormProps) {
  const [name, setName]       = useState("");
  const [contact, setContact] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/checkouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, borrowerName: name, borrowerContact: contact || undefined, dueDate: dueDate || undefined }),
      });
      if (res.status === 409) { toast.error("Book is already checked out"); return; }
      if (!res.ok) { toast.error("Failed to create checkout"); return; }
      toast.success(`Checked out to ${name}`);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check Out Book</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">{title}</p>
        <form onSubmit={submit} className="space-y-3 py-2">
          <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Borrower name *" />
          <Input value={contact} onChange={e => setContact(e.target.value)} placeholder="Contact (email/phone)" />
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="Due date" />
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !name.trim()}>Check Out</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
