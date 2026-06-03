"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  seriesId:    number;
  name:        string;
  totalBooks?: number | null;
  description?: string | null;
}

export function SeriesDetailActions({ seriesId, name: initialName, totalBooks: initialTotal, description: initialDesc }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen]       = useState(false);
  const [name,        setName]        = useState(initialName);
  const [totalBooks,  setTotalBooks]  = useState(initialTotal?.toString() ?? "");
  const [description, setDescription] = useState(initialDesc ?? "");
  const [saving,      setSaving]      = useState(false);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/series/${seriesId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          totalBooks: totalBooks ? parseInt(totalBooks) : undefined,
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) { toast.error("Failed to update series"); return; }
      toast.success("Series updated");
      setEditOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteSeries() {
    if (!confirm(`Delete series "${initialName}"? Books will not be deleted.`)) return;
    await fetch(`/api/series/${seriesId}`, { method: "DELETE" });
    toast.success("Series deleted");
    router.push("/series");
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil className="h-4 w-4 mr-2" /> Edit
      </Button>
      <Button variant="ghost" size="sm" onClick={deleteSeries} className="text-destructive hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={editOpen} onOpenChange={v => !v && setEditOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Series</DialogTitle></DialogHeader>
          <form onSubmit={saveEdit} className="space-y-3 py-2">
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Series name *" />
            <Input type="number" min={1} value={totalBooks} onChange={e => setTotalBooks(e.target.value)} placeholder="Total books in series (optional)" />
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !name.trim()}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
