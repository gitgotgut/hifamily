import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { circleCreateSchema } from "@/lib/validations/circle";

// GET /api/circles — circles the current user belongs to
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const circles = await prisma.circle.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { members: true } },
      members: { where: { userId }, select: { role: true } },
    },
  });

  return NextResponse.json(
    circles.map((c) => ({
      id: c.id,
      name: c.name,
      isOwner: c.ownerId === userId,
      role: c.members[0]?.role ?? "member",
      memberCount: c._count.members,
    }))
  );
}

// POST /api/circles — create a circle (creator becomes admin member)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = circleCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const circle = await prisma.circle.create({
    data: {
      name: parsed.data.name,
      ownerId: session.user.id,
      members: { create: { userId: session.user.id, role: "admin" } },
    },
  });

  return NextResponse.json(circle, { status: 201 });
}
