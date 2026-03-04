import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CalendarClient from "@/components/calendar/CalendarClient";
import InviteToast from "@/components/calendar/InviteToast";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const sp = await searchParams;

  const userId = session.userId;

  // All calendar IDs this user is a member of
  const memberships = await prisma.calendarMember.findMany({
    where: { userId },
    select: { calendarId: true },
  });
  const calendarIds = memberships.map((m) => m.calendarId);

  // All events in those calendars + accepted attendee events outside those calendars
  const [events, attendeeRows] = await Promise.all([
    prisma.event.findMany({
      where: { calendarId: { in: calendarIds } },
      include: { calendar: { select: { color: true, id: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.eventAttendee.findMany({
      where: {
        userId,
        status: "accepted",
        event: { calendarId: { notIn: calendarIds } },
      },
      include: {
        event: {
          include: { calendar: { select: { color: true, id: true } } },
        },
      },
    }),
  ]);

  type SerializableEvent = {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    allDay: boolean;
    rrule: string | null;
    calendar: { color: string };
    calendarId: string;
    timezone: string;
    description: string | null;
  };

  const serializeEvent = (e: SerializableEvent) => ({
    id: e.id,
    title: e.title,
    start: e.startTime.toISOString(),
    end: e.endTime.toISOString(),
    allDay: e.allDay,
    rrule: e.rrule ?? undefined,
    color: e.calendar.color,
    calendarId: e.calendarId,
    timezone: e.timezone,
    description: e.description ?? undefined,
  });

  const serialized = [
    ...events.map(serializeEvent),
    ...attendeeRows.map((row) => serializeEvent(row.event)),
  ];

  return (
    <div className="h-full p-4 pb-20 md:pb-4">
      <CalendarClient events={serialized} userId={userId} />
      {sp.invite && <InviteToast status={sp.invite} />}
    </div>
  );
}
