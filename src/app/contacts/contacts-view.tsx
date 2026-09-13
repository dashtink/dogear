"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Mail, Phone, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Contact {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

interface ContactsViewProps {
  initialContacts: Contact[];
}

function ContactForm({
  contact,
  onSave,
  onClose,
}: {
  contact?: Contact;
  onSave: (data: Omit<Contact, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [name,  setName]  = useState(contact?.name  ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, notes: notes.trim() || null });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 py-2">
      <Input required value={name}  onChange={e => setName(e.target.value)}  placeholder="Name *" />
      <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" />
      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" />
      <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" />
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving || !name.trim()}>Save</Button>
      </DialogFooter>
    </form>
  );
}

export function ContactsView({ initialContacts }: ContactsViewProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [addOpen,  setAddOpen]  = useState(false);
  const [editing,  setEditing]  = useState<Contact | null>(null);
  const [search,   setSearch]   = useState("");

  async function addContact(data: Omit<Contact, "id">) {
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Failed to save contact"); return; }
    const created = await res.json();
    setContacts(c => [...c, created].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success("Contact added");
  }

  async function updateContact(data: Omit<Contact, "id">) {
    if (!editing) return;
    const res = await fetch(`/api/contacts/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Failed to update contact"); return; }
    const updated = await res.json();
    setContacts(c => c.map(x => x.id === updated.id ? updated : x).sort((a, b) => a.name.localeCompare(b.name)));
    toast.success("Contact updated");
  }

  async function deleteContact(id: number) {
    if (!confirm("Delete this contact?")) return;
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete contact"); return; }
    setContacts(c => c.filter(x => x.id !== id));
    toast.success("Contact deleted");
  }

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-1">Saved borrowers for quick checkout</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Contact
        </Button>
      </div>

      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search contacts…"
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{contacts.length === 0 ? "No contacts yet" : "No matches"}</p>
          {contacts.length === 0 && (
            <p className="text-sm mt-1">Add contacts to quickly fill in borrower details at checkout.</p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(c => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{c.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  {c.email && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" /> {c.email}
                    </span>
                  )}
                  {c.phone && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </span>
                  )}
                </div>
                {c.notes && <p className="text-xs text-muted-foreground mt-1 italic">{c.notes}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setEditing(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteContact(c.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={v => !v && setAddOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
          <ContactForm onSave={addContact} onClose={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={v => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
          {editing && <ContactForm contact={editing} onSave={updateContact} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
