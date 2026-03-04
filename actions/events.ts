"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEventInviteEmail } from "@/lib/emails/sendEventInvite";

// ──────────────────────────────────────────────────────
// Create Event
// ──────────────────────────────────────────────────────
export async function createEvent(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const startTime = new Date(formData.get("startTime") as string);
  const endTime = new Date(formData.get("endTime") as string);
  const timezone = (formData.get("timezone") as string) || "UTC";
  const allDay = formData.get("allDay") === "true";
  const calendarId = formData.get("calendarId") as string;
  const rrule = (formData.get("rrule") as string) || null;
  const recurrenceEnd = formData.get("recurrenceEnd")
    ? new Date(formData.get("recurrenceEnd") as string)
    : null;
  const attendeeEmails: string[] = JSON.parse(
    (formData.get("attendeeEmails") as string) || "[]"
  );

  if (!title || !startTime || !endTime || !calendarId) {
    return { error: "Missing required fields" };
  }

  // Verify user is a member of the calendar
  const membership = await prisma.calendarMember.findUnique({
    where: { calendarId_userId: { calendarId, userId: session.userId } },
  });
  if (!membership) return { error: "Not a member of this calendar" };

  const event = await prisma.event.create({
    data: {
      title,
      description,
      startTime,
      endTime,
      timezone,
      allDay,
      calendarId,
      creatorId: session.userId,
      rrule,
      recurrenceEnd,
    },
  });

  // Handle attendee invites
  if (attendeeEmails.length > 0) {
    for (const email of attendeeEmails) {
      const invitee = await prisma.user.findUnique({ where: { email } });
      if (invitee) {
        // Create EventAttendee row
        await prisma.eventAttendee.upsert({
          where: { eventId_userId: { eventId: event.id, userId: invitee.id } },
          update: {},
          create: { eventId: event.id, userId: invitee.id, status: "pending" },
        });

        // Create invite token
        const token = await prisma.inviteToken.create({
          data: {
            type: "event",
            targetId: event.id,
            inviteeId: invitee.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        await sendEventInviteEmail({
          to: email,
          inviteeName: invitee.name ?? email,
          eventTitle: title,
          startTime,
          endTime,
          timezone,
          token: token.token,
        });
      }
    }
  }

  revalidatePath("/calendar");
  return { success: true, eventId: event.id };
}

// ──────────────────────────────────────────────────────
// Update Event
// ──────────────────────────────────────────────────────
export async function updateEvent(eventId: string, formData: FormData) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      calendar: true,
      attendees: { include: { user: true } },
    },
  });
  if (!event) return { error: "Event not found" };

  // Only creator or calendar owner can edit
  const isCreator = event.creatorId === session.userId;
  const isOwner = event.calendar.ownerId === session.userId;
  if (!isCreator && !isOwner) return { error: "Not authorized" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const startTime = new Date(formData.get("startTime") as string);
  const endTime = new Date(formData.get("endTime") as string);
  const timezone = (formData.get("timezone") as string) || "UTC";
  const allDay = formData.get("allDay") === "true";
  const calendarId = formData.get("calendarId") as string;
  const rrule = (formData.get("rrule") as string) || null;
  const recurrenceEnd = formData.get("recurrenceEnd")
    ? new Date(formData.get("recurrenceEnd") as string)
    : null;
  const attendeeEmails: string[] = JSON.parse(
    (formData.get("attendeeEmails") as string) || "[]"
  );

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title,
      description,
      startTime,
      endTime,
      timezone,
      allDay,
      calendarId,
      rrule,
      recurrenceEnd,
    },
  });

  // Sync attendees
  const existingEmails = event.attendees.map((a) => a.user.email);
  const submittedEmails = attendeeEmails.map((e) => e.toLowerCase());

  // Add new attendees
  for (const email of submittedEmails) {
    if (existingEmails.includes(email)) continue;
    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) continue;

    await prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId, userId: invitee.id } },
      update: {},
      create: { eventId, userId: invitee.id, status: "pending" },
    });

    const token = await prisma.inviteToken.create({
      data: {
        type: "event",
        targetId: eventId,
        inviteeId: invitee.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await sendEventInviteEmail({
      to: email,
      inviteeName: invitee.name ?? email,
      eventTitle: title,
      startTime,
      endTime,
      timezone,
      token: token.token,
    });
  }

  // Remove attendees no longer in the list
  const removedAttendees = event.attendees.filter(
    (a) => !submittedEmails.includes(a.user.email)
  );
  for (const a of removedAttendees) {
    await prisma.eventAttendee.delete({
      where: { eventId_userId: { eventId, userId: a.userId } },
    });
  }

  revalidatePath("/calendar");
  return { success: true };
}

// ──────────────────────────────────────────────────────
// Delete Event
// ──────────────────────────────────────────────────────
export async function deleteEvent(eventId: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { calendar: true },
  });
  if (!event) return { error: "Event not found" };

  const isCreator = event.creatorId === session.userId;
  const isOwner = event.calendar.ownerId === session.userId;
  if (!isCreator && !isOwner) return { error: "Not authorized" };

  await prisma.event.delete({ where: { id: eventId } });

  revalidatePath("/calendar");
  return { success: true };
}

// ──────────────────────────────────────────────────────
// Search users by email (for invite autocomplete)
// ──────────────────────────────────────────────────────
export async function searchUsers(query: string) {
  const session = await getSession();
  if (!session?.userId) return [];

  if (query.length < 2) return [];

  return prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
      NOT: { id: session.userId },
    },
    select: { id: true, name: true, email: true, image: true },
    take: 5,
  });
}
