"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function respondToEventInvite(
  eventId: string,
  status: "accepted" | "declined"
) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  await prisma.eventAttendee.updateMany({
    where: { eventId, userId: session.userId },
    data: { status },
  });

  // Notify the event creator (skip if they invited themselves)
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, creatorId: true },
  });

  if (event && event.creatorId !== session.userId) {
    const attendeeName = session.name ?? session.email;
    await prisma.notification.create({
      data: {
        userId: event.creatorId,
        type: "event_response",
        title: `${attendeeName} ${status === "accepted" ? "accepted" : "declined"} "${event.title}"`,
        eventId,
      },
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function dismissNotification(id: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  await prisma.notification.updateMany({
    where: { id, userId: session.userId },
    data: { read: true },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
