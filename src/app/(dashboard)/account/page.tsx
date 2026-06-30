import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "./account-form";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, displayName: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Account</h1>
      <AccountForm email={user.email} displayName={user.displayName ?? ""} />
    </div>
  );
}
