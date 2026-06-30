import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  CreditCard,
  CalendarDays,
  Images,
  ArrowRight,
  CalendarPlus,
  ImagePlus,
  Activity,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getActivity } from "@/lib/activity";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // Subscription lives in hifamily's own schema; Event/Album belong to the
  // other platforms' schemas, so read their counts from the shared DB directly.
  const [user, subscriptions, eventRows, albumRows, activity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, email: true },
    }),
    prisma.subscription.count({ where: { userId } }),
    prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS count FROM "Event" WHERE "hostId" = ${userId}`,
    prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS count FROM "Album" WHERE "ownerId" = ${userId}`,
    getActivity(userId),
  ]);

  const activityIcon = {
    event: CalendarPlus,
    album: ImagePlus,
    photos: Images,
  } as const;

  const events = eventRows[0]?.count ?? 0;
  const albums = albumRows[0]?.count ?? 0;
  const greetingName = user?.displayName || user?.email?.split("@")[0] || "there";

  const platforms = [
    {
      name: "Subscriptions",
      tagline: "Track recurring spend & insurance",
      icon: CreditCard,
      url: process.env.NEXT_PUBLIC_HUGO_URL || "http://localhost:3001",
      stat: `${subscriptions} ${subscriptions === 1 ? "subscription" : "subscriptions"}`,
      accent: "text-[#4A6FA5] bg-[#4A6FA5]/10",
    },
    {
      name: "Events",
      tagline: "Plan get-togethers & RSVP",
      icon: CalendarDays,
      url: process.env.NEXT_PUBLIC_PLANS_URL || "http://localhost:3002",
      stat: `${events} ${events === 1 ? "event" : "events"}`,
      accent: "text-[#C8644A] bg-[#C8644A]/10",
    },
    {
      name: "Photos",
      tagline: "Share albums with family",
      icon: Images,
      url: process.env.NEXT_PUBLIC_PHOTO_URL || "http://localhost:3003",
      stat: `${albums} ${albums === 1 ? "album" : "albums"}`,
      accent: "text-[#E5A572] bg-[#E5A572]/10",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Hi {greetingName} 👋</h1>
        <p className="text-muted-foreground">
          Your family and friends, all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((p) => {
          const Icon = p.icon;
          return (
            <a key={p.name} href={p.url} className="group">
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${p.accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-0.5">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.tagline}</p>
                  </div>
                  <p className="text-sm font-medium">{p.stat}</p>
                  <div className="mt-auto flex items-center gap-1.5 text-primary text-sm font-medium">
                    Open
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>

      {activity.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent activity
          </h2>
          <Card>
            <CardContent className="py-1 divide-y">
              {activity.map((item, i) => {
                const Icon = activityIcon[item.type];
                return (
                  <a
                    key={i}
                    href={item.href}
                    className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm min-w-0">
                      {item.type === "photos" ? (
                        <>
                          <strong>{item.count}</strong>{" "}
                          {item.count === 1 ? "new photo" : "new photos"} in{" "}
                          <strong>{item.title}</strong>
                        </>
                      ) : (
                        <>
                          <strong>{item.actor}</strong>{" "}
                          {item.type === "event" ? "created event" : "started album"}{" "}
                          <strong>{item.title}</strong>
                        </>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(item.time, { addSuffix: true })}
                    </span>
                  </a>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
