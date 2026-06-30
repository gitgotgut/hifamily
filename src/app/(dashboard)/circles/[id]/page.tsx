import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CircleManage } from "./manage";

export const dynamic = "force-dynamic";

export default async function CircleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const circle = await prisma.circle.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: { user: { select: { id: true, displayName: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      invites: {
        where: { status: "pending" },
        select: { id: true, email: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!circle) notFound();

  const isOwner = circle.ownerId === userId;
  const amMember = circle.members.some((m) => m.userId === userId);
  if (!amMember) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/circles"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to circles
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">{circle.name}</h1>
        {isOwner && <Badge variant="secondary">Owner</Badge>}
      </div>

      <CircleManage
        circleId={circle.id}
        isOwner={isOwner}
        ownerId={circle.ownerId}
        currentUserId={userId}
        members={circle.members.map((m) => ({
          userId: m.userId,
          name: m.user.displayName ?? m.user.email,
          email: m.user.email,
          role: m.role,
        }))}
        pendingInvites={
          isOwner ? circle.invites.map((i) => ({ id: i.id, email: i.email })) : []
        }
      />
    </div>
  );
}
