import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { addMinutes } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Origins we are allowed to hand a code to (prevents open-redirect abuse).
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_HUGO_URL,
  process.env.NEXT_PUBLIC_PLANS_URL,
  process.env.NEXT_PUBLIC_PHOTO_URL,
].filter(Boolean) as string[];

function isAllowedRedirect(target: string): boolean {
  try {
    const url = new URL(target);
    return ALLOWED_ORIGINS.some((origin) => {
      try {
        return new URL(origin).origin === url.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * SSO authorize endpoint.
 *
 * A consumer platform sends the user here with `?redirect=<its-callback-url>`.
 * - If the redirect target isn't an allowed platform origin, bail to the hub.
 * - If the user isn't signed in to hifamily, send them to login and return here.
 * - Otherwise mint a single-use, short-lived code (stored in the shared DB) and
 *   bounce back to the platform with `?code=`. The code never carries identity
 *   itself; the platform exchanges it server-side. Keeps tokens out of URLs.
 */
export default async function SsoAuthorizePage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const target = searchParams.redirect;

  if (!target || !isAllowedRedirect(target)) {
    redirect("/hub");
  }

  const session = await auth();
  if (!session?.user?.id) {
    const back = `/sso?redirect=${encodeURIComponent(target!)}`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id as string },
    select: { id: true },
  });
  if (!user) {
    const back = `/sso?redirect=${encodeURIComponent(target!)}`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  const code = randomBytes(32).toString("hex");
  await prisma.ssoCode.create({
    data: { code, userId: user!.id, expiresAt: addMinutes(new Date(), 2) },
  });

  const url = new URL(target!);
  url.searchParams.set("code", code);
  redirect(url.toString());
}
