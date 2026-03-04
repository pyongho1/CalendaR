import { getApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";
// Ensure the admin app is initialized
import "@/lib/firebase-admin";

export async function sendPushToUsers(userIds: string[], title: string, body: string) {
  try {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, fcmToken: { not: null } },
      select: { fcmToken: true },
    });

    const tokens = users.map((u) => u.fcmToken).filter(Boolean) as string[];
    if (tokens.length === 0) return;

    await getMessaging(getApp()).sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: { notification: { icon: "/icon" } },
    });
  } catch {
    // Stale tokens and unavailable FCM are non-fatal
  }
}
