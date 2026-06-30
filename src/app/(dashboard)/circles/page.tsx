import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateCircleForm } from "./create-circle-form";

export const dynamic = "force-dynamic";

export default async function CirclesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const circles = await prisma.circle.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { members: true } } },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Circles</h1>
      <p className="text-muted-foreground mb-6">
        Family and friend groups. Anything you share with a circle is visible to
        everyone in it.
      </p>

      <div className="mb-8">
        <CreateCircleForm />
      </div>

      {circles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            You&apos;re not in any circles yet. Create one above to start sharing.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {circles.map((c) => (
            <Link key={c.id} href={`/circles/${c.id}`} className="block">
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{c.name}</span>
                    {c.ownerId === userId && (
                      <Badge variant="secondary" className="ml-2">Owner</Badge>
                    )}
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {c._count.members}{" "}
                      {c._count.members === 1 ? "member" : "members"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
