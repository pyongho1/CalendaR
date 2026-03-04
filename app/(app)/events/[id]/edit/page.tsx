import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import EventForm from "@/components/calendar/EventForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      calendar: true,
      attendees: { include: { user: true } },
    },
  });
  if (!event) notFound();

  // Verify user has access
  const membership = await prisma.calendarMember.findUnique({
    where: {
      calendarId_userId: {
        calendarId: event.calendarId,
        userId: session.userId,
      },
    },
  });
  if (!membership) redirect("/calendar");

  const calendars = await prisma.calendar.findMany({
    where: { members: { some: { userId: session.userId } } },
    orderBy: [{ isPersonal: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Back to calendar
        </Link>
        <h1 className="text-xl font-semibold mt-3">Edit Event</h1>
      </div>

      <EventForm
        calendars={calendars}
        defaultCalendarId={event.calendarId}
        eventId={event.id}
        initialValues={{
          title: event.title,
          description: event.description ?? "",
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          timezone: event.timezone,
          allDay: event.allDay,
          calendarId: event.calendarId,
          rrule: event.rrule,
          recurrenceEnd: event.recurrenceEnd?.toISOString() ?? null,
        }}
        initialAttendees={event.attendees.map((a) => ({
          id: a.user.id,
          name: a.user.name,
          email: a.user.email,
          image: a.user.image,
        }))}
      />
    </div>
  );
}
