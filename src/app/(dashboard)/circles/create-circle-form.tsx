"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateCircleForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create the circle.");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={create} className="flex gap-2">
      <Input
        placeholder="New circle name (e.g. Close family)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
      />
      <Button type="submit" disabled={loading} className="gap-2 shrink-0">
        <Plus className="h-4 w-4" />
        {loading ? "Creating…" : "Create"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
