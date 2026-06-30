"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Member = { userId: string; name: string; email: string; role: string };
type Invite = { id: string; email: string };

export function CircleManage({
  circleId,
  isOwner,
  ownerId,
  currentUserId,
  members,
  pendingInvites,
}: {
  circleId: string;
  isOwner: boolean;
  ownerId: string;
  currentUserId: string;
  members: Member[];
  pendingInvites: Invite[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSent(false);
    setLoading(true);
    const res = await fetch(`/api/circles/${circleId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not send the invite.");
      return;
    }
    setEmail("");
    setSent(true);
    router.refresh();
  }

  async function cancelInvite(inviteEmail: string) {
    const res = await fetch(
      `/api/circles/${circleId}/invites?email=${encodeURIComponent(inviteEmail)}`,
      { method: "DELETE" }
    );
    if (res.ok) router.refresh();
  }

  async function removeMember(userId: string) {
    const res = await fetch(
      `/api/circles/${circleId}/members?userId=${userId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
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
            <CardTitle className="text-base">Invite someone</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={invite} className="flex gap-2">
              <Input
                type="email"
                placeholder="family@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSent(false);
                }}
                required
              />
              <Button type="submit" disabled={loading} className="gap-2 shrink-0">
                <UserPlus className="h-4 w-4" />
                {loading ? "Inviting…" : "Invite"}
              </Button>
            </form>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            {sent && (
              <p className="text-sm text-green-600 mt-2">
                Invitation sent. They&apos;ll see it when they sign in.
              </p>
            )}

            {pendingInvites.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  Pending invites
                </p>
                <ul className="space-y-1.5 text-sm">
                  {pendingInvites.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{inv.email}</span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Cancel invite for ${inv.email}`}
                        onClick={() => cancelInvite(inv.email)}
                        className="text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
