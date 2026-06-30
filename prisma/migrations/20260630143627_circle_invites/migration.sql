-- Circle invitations (pending until the invited email accepts)

CREATE TABLE "CircleInvite" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CircleInvite_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CircleInvite_email_idx" ON "CircleInvite"("email");
CREATE UNIQUE INDEX "CircleInvite_circleId_email_key" ON "CircleInvite"("circleId", "email");

ALTER TABLE "CircleInvite" ADD CONSTRAINT "CircleInvite_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleInvite" ADD CONSTRAINT "CircleInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
