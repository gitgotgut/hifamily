import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const respondSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

// PATCH /api/invites/[id] — invitee accepts or declines a circle invite
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const invite = await prisma.circleInvite.findUnique({
    where: { id: params.id },
  });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  // The invite must be addressed to the current user's email.
  if (!me || invite.email.toLowerCase() !== me.email.toLowerCase()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: "This invite was already answered" },
      { status: 400 }
    );
  }

  if (parsed.data.action === "accept") {
    await prisma.$transaction([
      prisma.circleMember.upsert({
        where: {
          circleId_userId: { circleId: invite.circleId, userId: session.user.id },
        },
        create: {
          circleId: invite.circleId,
          userId: session.user.id,
          role: "member",
        },
        update: {},
      }),
      prisma.circleInvite.update({
        where: { id: invite.id },
        data: { status: "accepted" },
      }),
    ]);
  } else {
    await prisma.circleInvite.update({
      where: { id: invite.id },
      data: { status: "declined" },
    });
  }

  return NextResponse.json({ ok: true });
}
