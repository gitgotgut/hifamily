import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

// Origins we are allowed to hand a token to (prevents open-redirect abuse).
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
 * - Otherwise mint a short-lived handoff token and bounce back to the platform.
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
  });
  if (!user) {
    const back = `/sso?redirect=${encodeURIComponent(target!)}`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  const token = await generateToken({
    sub: user!.id,
    email: user!.email,
    displayName: user!.displayName ?? undefined,
    platforms: ["hugo", "plans", "photo"],
  });

  const url = new URL(target!);
  url.searchParams.set("token", token);
  redirect(url.toString());
}
