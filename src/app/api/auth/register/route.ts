import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Resend } from "resend";
import { randomBytes, createHash } from "crypto";
import { addHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { rateLimit, ipFrom } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // Throttle registrations per client IP.
    if (!(await rateLimit("register", ipFrom(req), 5, 600))) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);
    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerifyToken: hashedToken,
        emailVerifyExpiry: addHours(new Date(), 24),
      },
      select: { id: true, email: true, createdAt: true },
    });

    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${rawToken}`;
    const from = process.env.EMAIL_FROM || "hifamily <onboarding@resend.dev>";
    const { error: sendError } = await resend.emails.send({
      from,
      to: email,
      subject: "Verify your hifamily email",
      html: `<p>Welcome to hifamily!</p><p>Confirm your email to activate your account:</p><p><a href="${verifyUrl}">Verify my email</a></p><p>This link expires in 24 hours.</p>`,
    });
    if (sendError) {
      console.error("Verification email failed:", sendError);
    }

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
