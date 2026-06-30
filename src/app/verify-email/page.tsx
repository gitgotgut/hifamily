import Link from "next/link";
import { createHash } from "crypto";
import { CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  let ok = false;

  if (token) {
    const hashed = createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findUnique({
      where: { emailVerifyToken: hashed },
      select: { id: true, emailVerifyExpiry: true },
    });
    if (user && user.emailVerifyExpiry && user.emailVerifyExpiry > new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          emailVerifyToken: null,
          emailVerifyExpiry: null,
        },
      });
      ok = true;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {ok ? (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Email verified</h1>
            <p className="text-sm text-gray-500 mb-6">
              Your account is active. You can sign in now.
            </p>
          </>
        ) : (
          <>
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Link invalid or expired</h1>
            <p className="text-sm text-gray-500 mb-6">
              This verification link is no longer valid. Try registering again to
              receive a fresh link.
            </p>
          </>
        )}
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
