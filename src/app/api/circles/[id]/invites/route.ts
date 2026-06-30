import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addMemberSchema } from "@/lib/validations/circle";
import { sendEmail } from "@/lib/email";

// POST /api/circles/[id]/invites — owner invites someone by email
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const circle = await prisma.circle.findUnique({ where: { id: params.id } });
  if (!circle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (circle.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }
  const email = parsed.data.email.toLowerCase();

  // Already a member?
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    const member = await prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId: params.id, userId: existingUser.id } },
    });
    if (member) {
      return NextResponse.json(
        { error: "That person is already a member" },
        { status: 400 }
      );
    }
  }

  const invite = await prisma.circleInvite.upsert({
    where: { circleId_email: { circleId: params.id, email } },
    create: {
      circleId: params.id,
      email,
      invitedById: session.user.id,
      status: "pending",
    },
    update: { status: "pending", invitedById: session.user.id },
  });

  // Best-effort notification (works once email sending is configured).
  const url = `${process.env.NEXTAUTH_URL}/circles`;
  await sendEmail({
    to: email,
    subject: `You're invited to ${circle.name} on hifamily`,
    html: `<p>You've been invited to join the <strong>${circle.name}</strong> circle on hifamily.</p><p><a href="${url}">Sign in to accept</a> — if you don't have an account yet, register with this email and the invite will be waiting for you.</p>`,
  });

  return NextResponse.json(invite, { status: 201 });
}

// DELETE /api/circles/[id]/invites?email=... — owner cancels a pending invite
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const circle = await prisma.circle.findUnique({ where: { id: params.id } });
  if (!circle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (circle.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = req.nextUrl.searchParams.get("email")?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  await prisma.circleInvite
    .delete({ where: { circleId_email: { circleId: params.id, email } } })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
