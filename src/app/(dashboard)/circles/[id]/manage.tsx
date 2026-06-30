"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Member = { userId: string; name: string; email: string; role: string };

export function CircleManage({
  circleId,
  isOwner,
  ownerId,
  currentUserId,
  members,
}: {
  circleId: string;
  isOwner: boolean;
  ownerId: string;
  currentUserId: string;
  members: Member[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/circles/${circleId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not add member.");
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function removeMember(userId: string) {
    const res = await fetch(
      `/api/circles/${circleId}/members?userId=${userId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      // If you removed yourself, you can no longer view the circle.
      if (userId === currentUserId) router.push("/circles");
      else router.refresh();
    }
  }

  async function deleteCircle() {
    if (!window.confirm("Delete this circle? Members lose access to anything shared with it.")) return;
    const res = await fetch(`/api/circles/${circleId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/circles");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addMember} className="flex gap-2">
              <Input
                type="email"
                placeholder="family@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading} className="gap-2 shrink-0">
                <UserPlus className="h-4 w-4" />
                {loading ? "Adding…" : "Add"}
              </Button>
            </form>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {members.map((m) => {
              const isCircleOwner = m.userId === ownerId;
              const canRemove =
                (isOwner && !isCircleOwner) ||
                (m.userId === currentUserId && !isCircleOwner);
              return (
                <li key={m.userId} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{m.name}</span>
                    {isCircleOwner && <Badge variant="secondary">Owner</Badge>}
                    {m.userId === currentUserId && !isCircleOwner && (
                      <Badge variant="outline">You</Badge>
                    )}
                  </span>
                  {canRemove && (
                    <button
                      type="button"
                      aria-label={m.userId === currentUserId ? "Leave circle" : `Remove ${m.name}`}
                      onClick={() => removeMember(m.userId)}
                      className="text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {isOwner && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-red-600 hover:text-red-700"
            onClick={deleteCircle}
          >
            <Trash2 className="h-4 w-4" />
            Delete circle
          </Button>
        </div>
      )}
    </div>
  );
}
