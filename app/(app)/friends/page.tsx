import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { FriendInvite } from "@/lib/generated/prisma";
import FriendManager from "@/components/friends/FriendManager";

export default async function FriendsPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const allInvites = await prisma.friendInvite.findMany({
    where: {
      OR: [{ fromId: session.userId }, { toId: session.userId }],
    },
    include: {
      from: { select: { id: true, name: true, email: true, image: true } },
      to: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Accepted: both sides connected
  const friends = allInvites.filter((i: FriendInvite) => i.acceptedAt !== null);

  // Pending: sent by me, not yet accepted (recipient hasn't signed in)
  const pending = allInvites.filter(
    (i: FriendInvite) => i.fromId === session.userId && i.acceptedAt === null
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Friends</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add friends by email. They'll appear here once they sign in.
        </p>
      </div>
      <FriendManager
        userId={session.userId}
        friends={friends}
        pending={pending}
      />
    </div>
  );
}
