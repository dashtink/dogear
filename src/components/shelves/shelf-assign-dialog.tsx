"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Shelf { id: number; name: string; }

interface ShelfAssignDialogProps {
  bookId:   number;
  current?: { shelfId: number; row?: string | null; position?: number | null } | null;
  open:     boolean;
  onClose:  () => void;
  onSaved:  () => void;
}

export function ShelfAssignDialog({ bookId, current, open, onClose, onSaved }: ShelfAssignDialogProps) {
  const [shelves, setShelves]   = useState<Shelf[]>([]);
  const [shelfId, setShelfId]   = useState(current?.shelfId?.toString() ?? "");
  const [row, setRow]           = useState(current?.row ?? "");
  const [position, setPosition] = useState(current?.position?.toString() ?? "");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    fetch("/api/shelves").then(r => r.json()).then(setShelves);
  }, []);

  async function save() {
    if (!shelfId) return;
    setSaving(true);
    try {
      await fetch(`/api/books/${bookId}/location`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shelfId:  parseInt(shelfId),
          row:      row || undefined,
          position: position ? parseInt(position) : undefined,
        }),
      });
      toast.success("Shelf assigned");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to assign shelf");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await fetch(`/api/books/${bookId}/location`, { method: "DELETE" });
      toast.success("Location removed");
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
          <DialogTitle>Assign to Shelf</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Select value={shelfId} onValueChange={(v) => setShelfId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Select a shelf…" /></SelectTrigger>
            <SelectContent>
              {shelves.map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input value={row} onChange={e => setRow(e.target.value)} placeholder="Row (e.g. A)" />
            <Input value={position} onChange={e => setPosition(e.target.value)} placeholder="Position #" type="number" className="w-28" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          {current && (
            <Button variant="ghost" onClick={remove} disabled={saving} className="mr-auto text-destructive hover:text-destructive">
              Remove
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!shelfId || saving}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
