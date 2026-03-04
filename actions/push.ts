"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function saveFcmToken(token: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  await prisma.user.update({
    where: { id: session.userId },
    data: { fcmToken: token },
  });

  return { success: true };
}
