"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookMarked, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Shelf { id: number; name: string; description?: string | null; bookCount: number; }

export function ShelvesView() {
  const [shelves,   setShelves]   = useState<Shelf[]>([]);
  const [newName,   setNewName]   = useState("");
  const [editId,    setEditId]    = useState<number | null>(null);
  const [editName,  setEditName]  = useState("");
  const [saving,    setSaving]    = useState(false);

  async function load() {
    const res = await fetch("/api/shelves");
    setShelves(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function addShelf(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    await fetch("/api/shelves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    await load();
    toast.success("Shelf created");
    setSaving(false);
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) return;
    await fetch(`/api/shelves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setEditId(null);
    await load();
    toast.success("Shelf renamed");
  }

  async function deleteShelf(id: number, bookCount: number) {
    if (bookCount > 0 && !confirm(`This shelf has ${bookCount} book(s). Books will be unassigned. Continue?`)) return;
    await fetch(`/api/shelves/${id}`, { method: "DELETE" });
    await load();
    toast.success("Shelf deleted");
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <form onSubmit={addShelf} className="flex gap-2">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New shelf name…"
          className="flex-1"
        />
        <Button type="submit" disabled={saving || !newName.trim()}>
          <Plus className="h-4 w-4 mr-2" /> Add Shelf
        </Button>
      </form>

      {shelves.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No shelves yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shelves.map(shelf => (
            <Card key={shelf.id}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <BookMarked className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  {editId === shelf.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") saveEdit(shelf.id); if (e.key === "Escape") setEditId(null); }}
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(shelf.id)}><Check className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}><X className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{shelf.name}</span>
                      <Link href={`/library?shelf=${shelf.id}`}>
                        <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                          {shelf.bookCount} book{shelf.bookCount !== 1 ? "s" : ""}
                        </Badge>
                      </Link>
                    </div>
                  )}
                </div>
                {editId !== shelf.id && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditId(shelf.id); setEditName(shelf.name); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteShelf(shelf.id, shelf.bookCount)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
