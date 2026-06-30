import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/invites — pending circle invites addressed to the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!me) return NextResponse.json([], { status: 200 });

  const invites = await prisma.circleInvite.findMany({
    where: { email: me.email.toLowerCase(), status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      circle: { select: { id: true, name: true } },
      invitedBy: { select: { displayName: true, email: true } },
    },
  });

  return NextResponse.json(
    invites.map((i) => ({
      id: i.id,
      circleName: i.circle.name,
      invitedBy: i.invitedBy.displayName ?? i.invitedBy.email,
    }))
  );
}
