import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal("")),
});

// PATCH /api/account — update the current user's profile (display name)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: parsed.data.displayName ? parsed.data.displayName : null },
    select: { email: true, displayName: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/account — GDPR deletion; cascades to all owned data
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: session.user.id } });

  return new NextResponse(null, { status: 204 });
}
