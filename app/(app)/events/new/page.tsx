import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Calendar } from "@/lib/generated/prisma";
import { redirect } from "next/navigation";
import EventForm from "@/components/calendar/EventForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface SearchParams {
  start?: string;
  end?: string;
  allDay?: string;
}

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const sp = await searchParams;

  const calendars = await prisma.calendar.findMany({
    where: { members: { some: { userId: session.userId } } },
    orderBy: [{ isPersonal: "desc" }, { createdAt: "asc" }],
  });

  const personalCalendar = calendars.find((c: Calendar) => c.isPersonal) ?? calendars[0];

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Back to calendar
        </Link>
        <h1 className="text-xl font-semibold mt-3">New Event</h1>
      </div>

      <EventForm
        calendars={calendars}
        defaultCalendarId={personalCalendar?.id ?? ""}
        defaultStart={sp.start}
        defaultEnd={sp.end}
        defaultAllDay={sp.allDay === "true"}
      />
    </div>
  );
}
