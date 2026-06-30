"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Invite = { id: string; circleName: string; invitedBy: string };

export function PendingInvites({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function respond(id: string, action: "accept" | "decline") {
    setBusy(id);
    const res = await fetch(`/api/invites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          Invitations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {invites.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-3 flex-wrap"
            >
              <span className="text-sm">
                <strong>{inv.circleName}</strong>{" "}
                <span className="text-muted-foreground">
                  · invited by {inv.invitedBy}
                </span>
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busy === inv.id}
                  onClick={() => respond(inv.id, "accept")}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === inv.id}
                  onClick={() => respond(inv.id, "decline")}
                >
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
