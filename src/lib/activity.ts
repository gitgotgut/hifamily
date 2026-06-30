import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ActivityItem = {
  type: "event" | "album" | "photos";
  time: Date;
  title: string;
  actor?: string;
  count?: number;
  href: string;
};

// Recent cross-platform activity the user can see: events and albums they own
// or that are shared with one of their circles, plus photo uploads to albums
// they can access. Read from the shared DB via raw SQL (Event/Album/Photo live
// in the other apps' schemas).
export async function getActivity(userId: string): Promise<ActivityItem[]> {
  const circleRows = await prisma.$queryRaw<{ circleId: string }[]>`
    SELECT "circleId" FROM "CircleMember" WHERE "userId" = ${userId}`;
  // Sentinel keeps the IN (...) list non-empty so Prisma.join never throws.
  const circles = circleRows.length
    ? circleRows.map((r) => r.circleId)
    : ["__none__"];
  const circleList = Prisma.join(circles);

  const plansUrl = process.env.NEXT_PUBLIC_PLANS_URL || "http://localhost:3002";
  const photoUrl = process.env.NEXT_PUBLIC_PHOTO_URL || "http://localhost:3003";

  const events = await prisma.$queryRaw<
    { id: string; title: string; createdAt: Date; actor: string | null; email: string }[]
  >`
    SELECT e."id", e."title", e."createdAt", u."displayName" AS actor, u."email"
    FROM "Event" e JOIN "User" u ON u."id" = e."hostId"
    WHERE e."hostId" = ${userId}
       OR (e."visibility" = 'OPEN' AND e."circleId" IN (${circleList}))
    ORDER BY e."createdAt" DESC LIMIT 10`;

  const albums = await prisma.$queryRaw<
    { id: string; title: string; createdAt: Date; actor: string | null; email: string }[]
  >`
    SELECT a."id", a."title", a."createdAt", u."displayName" AS actor, u."email"
    FROM "Album" a JOIN "User" u ON u."id" = a."ownerId"
    WHERE a."ownerId" = ${userId}
       OR (a."visibility" = 'OPEN' AND a."circleId" IN (${circleList}))
    ORDER BY a."createdAt" DESC LIMIT 10`;

  const photos = await prisma.$queryRaw<
    { albumId: string; title: string; last: Date; cnt: number }[]
  >`
    SELECT a."id" AS "albumId", a."title", MAX(p."createdAt") AS last, COUNT(*)::int AS cnt
    FROM "Photo" p JOIN "Album" a ON a."id" = p."albumId"
    WHERE a."ownerId" = ${userId}
       OR EXISTS (SELECT 1 FROM "AlbumAccess" ac WHERE ac."albumId" = a."id" AND ac."userId" = ${userId})
       OR (a."visibility" = 'OPEN' AND a."circleId" IN (${circleList}))
    GROUP BY a."id", a."title"
    ORDER BY last DESC LIMIT 10`;

  const items: ActivityItem[] = [
    ...events.map((e) => ({
      type: "event" as const,
      time: e.createdAt,
      title: e.title,
      actor: e.actor ?? e.email,
      href: `${plansUrl}/events/${e.id}`,
    })),
    ...albums.map((a) => ({
      type: "album" as const,
      time: a.createdAt,
      title: a.title,
      actor: a.actor ?? a.email,
      href: `${photoUrl}/albums/${a.id}`,
    })),
    ...photos.map((p) => ({
      type: "photos" as const,
      time: p.last,
      title: p.title,
      count: Number(p.cnt),
      href: `${photoUrl}/albums/${p.albumId}`,
    })),
  ];

  items.sort((a, b) => b.time.getTime() - a.time.getTime());
  return items.slice(0, 15);
}
