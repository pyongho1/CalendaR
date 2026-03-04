import { getApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";
import "@/lib/firebase-admin";

export async function sendPushToUsers(userIds: string[], title: string, body: string) {
  try {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, fcmToken: { not: null } },
      select: { id: true, fcmToken: true },
    });

    const records = users.filter((u) => u.fcmToken) as { id: string; fcmToken: string }[];
    if (records.length === 0) return;

    const tokens = records.map((u) => u.fcmToken);

    const response = await getMessaging(getApp()).sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: { notification: { icon: "/icon" } },
    });

    // Log any per-token failures
    if (response.failureCount > 0) {
      const staleTokenOwnerIds: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code ?? "unknown";
          console.error(`[fcm] push failed for user ${records[idx].id}: ${code}`);
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            staleTokenOwnerIds.push(records[idx].id);
          }
        }
      });

      // Clear stale tokens from DB
      if (staleTokenOwnerIds.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: staleTokenOwnerIds } },
          data: { fcmToken: null },
        });
      }
    }
  } catch (e) {
    console.error("[fcm] sendEachForMulticast failed:", e);
  }
}
