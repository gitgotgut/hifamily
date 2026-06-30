import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/circles/[id]/members?userId=... — owner removes a member, or a
// member removes themselves (leaves the circle). The owner can't leave their
// own circle (delete the circle instead). Adding members is invite-based — see
// /api/circles/[id]/invites.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  const circle = await prisma.circle.findUnique({ where: { id: params.id } });
  if (!circle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const target = req.nextUrl.searchParams.get("userId");
  if (!target) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const isOwner = circle.ownerId === me;
  const removingSelf = target === me;

  if (target === circle.ownerId) {
    return NextResponse.json(
      { error: "The owner can't leave; delete the circle instead" },
      { status: 400 }
    );
  }
  if (!isOwner && !removingSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.circleMember
    .delete({
      where: { circleId_userId: { circleId: params.id, userId: target } },
    })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
