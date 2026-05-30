"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalizeISBN } from "@/lib/isbn-lookup";

interface ISBNInputProps {
  onScan: (isbn: string) => void;
}

export function ISBNInput({ onScan }: ISBNInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stripped = value.replace(/[-\s]/g, "");
    if (!/^\d{10}(\d{3})?$/.test(stripped)) {
      setError("Please enter a valid 10 or 13 digit ISBN");
      return;
    }
    setError("");
    onScan(normalizeISBN(stripped));
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1">
        <Input
          value={value}
          onChange={e => { setValue(e.target.value); setError(""); }}
          placeholder="Enter ISBN (e.g. 9780743273565)"
          className="font-mono"
        />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <Button type="submit">Look up</Button>
    </form>
  );
}
