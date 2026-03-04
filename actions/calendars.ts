"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendCalendarInviteEmail } from "@/lib/emails/sendCalendarInvite";

// ──────────────────────────────────────────────────────
// Create Group Calendar
// ──────────────────────────────────────────────────────
export async function createCalendar(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = (formData.get("color") as string) || "#3B82F6";

  if (!name) return { error: "Name is required" };

  const calendar = await prisma.calendar.create({
    data: {
      name,
      description,
      color,
      isPersonal: false,
      ownerId: session.userId,
      members: {
        create: { userId: session.userId, role: "owner" },
      },
    },
  });

  revalidatePath("/calendar");
  return { success: true, calendarId: calendar.id };
}

// ──────────────────────────────────────────────────────
// Update Calendar
// ──────────────────────────────────────────────────────
export async function updateCalendar(calendarId: string, formData: FormData) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  const calendar = await prisma.calendar.findUnique({ where: { id: calendarId } });
  if (!calendar || calendar.ownerId !== session.userId) {
    return { error: "Not authorized" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const color = formData.get("color") as string;

  await prisma.calendar.update({
    where: { id: calendarId },
    data: { name, description, color },
  });

  revalidatePath("/calendar");
  revalidatePath(`/calendars/${calendarId}`);
  return { success: true };
}

// ──────────────────────────────────────────────────────
// Delete Calendar
// ──────────────────────────────────────────────────────
export async function deleteCalendar(calendarId: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  const calendar = await prisma.calendar.findUnique({ where: { id: calendarId } });
  if (!calendar) return { error: "Not found" };
  if (calendar.isPersonal) return { error: "Cannot delete personal calendar" };
  if (calendar.ownerId !== session.userId) return { error: "Not authorized" };

  await prisma.calendar.delete({ where: { id: calendarId } });

  revalidatePath("/calendar");
  return { success: true };
}

// ──────────────────────────────────────────────────────
// Add Member by email
// ──────────────────────────────────────────────────────
export async function addMember(calendarId: string, email: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  const calendar = await prisma.calendar.findUnique({
    where: { id: calendarId },
    include: { owner: true },
  });
  if (!calendar || calendar.ownerId !== session.userId) {
    return { error: "Not authorized" };
  }

  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) return { error: "No user found with that email. They must sign in first." };

  // Check if already a member
  const existing = await prisma.calendarMember.findUnique({
    where: { calendarId_userId: { calendarId, userId: invitee.id } },
  });
  if (existing) return { error: "User is already a member" };

  await prisma.calendarMember.create({
    data: { calendarId, userId: invitee.id, role: "member" },
  });

  // Send invite email
  const token = await prisma.inviteToken.create({
    data: {
      type: "calendar",
      targetId: calendarId,
      inviteeId: invitee.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await sendCalendarInviteEmail({
    to: invitee.email,
    inviteeName: invitee.name ?? invitee.email,
    calendarName: calendar.name,
    ownerName: calendar.owner.name ?? session.email ?? "Someone",
    token: token.token,
  });

  revalidatePath(`/calendars/${calendarId}`);
  return { success: true };
}

// ──────────────────────────────────────────────────────
// Remove Member
// ──────────────────────────────────────────────────────
export async function removeMember(calendarId: string, userId: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "Not authenticated" };

  const calendar = await prisma.calendar.findUnique({ where: { id: calendarId } });
  if (!calendar || calendar.ownerId !== session.userId) {
    return { error: "Not authorized" };
  }
  if (userId === session.userId) {
    return { error: "Cannot remove yourself as owner" };
  }

  await prisma.calendarMember.delete({
    where: { calendarId_userId: { calendarId, userId } },
  });

  revalidatePath(`/calendars/${calendarId}`);
  return { success: true };
}
