"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function SeriesActions() {
  const router = useRouter();
  const [open,        setOpen]        = useState(false);
  const [name,        setName]        = useState("");
  const [totalBooks,  setTotalBooks]  = useState("");
  const [description, setDescription] = useState("");
  const [saving,      setSaving]      = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          totalBooks: totalBooks ? parseInt(totalBooks) : undefined,
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) { toast.error("Failed to create series"); return; }
      toast.success(`Series "${name}" created`);
      setOpen(false);
      setName(""); setTotalBooks(""); setDescription("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" /> New Series
      </Button>
      <Dialog open={open} onOpenChange={v => !v && setOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Series</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3 py-2">
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Series name *" />
            <Input type="number" min={1} value={totalBooks} onChange={e => setTotalBooks(e.target.value)} placeholder="Total books in series (optional)" />
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !name.trim()}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
