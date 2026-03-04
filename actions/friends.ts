"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendFriendInviteEmail } from "@/lib/emails/sendFriendInvite";

export async function sendFriendInvite(email: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === session.email.toLowerCase()) {
    return { error: "You can't add yourself as a friend" };
  }

  // Check if invite already exists
  const existing = await prisma.friendInvite.findUnique({
    where: { fromId_toEmail: { fromId: session.userId, toEmail: normalizedEmail } },
  });
  if (existing) return { error: "You've already sent a friend invite to this email" };

  // Check if this person already added us (reverse invite already accepted)
  const reverse = await prisma.friendInvite.findFirst({
    where: { toId: session.userId, from: { email: normalizedEmail }, acceptedAt: { not: null } },
  });
  if (reverse) return { error: "You're already friends" };

  // Check if invitee already has an account
  const invitee = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  await prisma.friendInvite.create({
    data: {
      fromId: session.userId,
      toEmail: normalizedEmail,
      toId: invitee?.id ?? null,
      acceptedAt: invitee ? new Date() : null,
    },
  });

  await sendFriendInviteEmail({
    to: normalizedEmail,
    inviteeName: invitee?.name ?? normalizedEmail,
    fromName: session.name ?? session.email,
  });

  revalidatePath("/friends");
  return { success: true };
}

export async function removeFriend(inviteId: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  const invite = await prisma.friendInvite.findUnique({ where: { id: inviteId } });
  if (!invite) return { error: "Not found" };
  if (invite.fromId !== session.userId && invite.toId !== session.userId) {
    return { error: "Not authorized" };
  }

  await prisma.friendInvite.delete({ where: { id: inviteId } });

  revalidatePath("/friends");
  return { success: true };
}
