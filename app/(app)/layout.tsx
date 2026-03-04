import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const [calendars, pendingInvites, responseNotifications] = await Promise.all([
    prisma.calendar.findMany({
      where: { members: { some: { userId: session.userId } } },
      orderBy: [{ isPersonal: "desc" }, { createdAt: "asc" }],
    }),
    prisma.eventAttendee.findMany({
      where: { userId: session.userId, status: "pending" },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startTime: true,
            calendar: { select: { color: true } },
          },
        },
      },
      orderBy: { event: { startTime: "asc" } },
    }),
    prisma.notification.findMany({
      where: { userId: session.userId, read: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const serializedInvites = pendingInvites.map((a: {
    id: string;
    event: { id: string; title: string; startTime: Date; calendar: { color: string } };
  }) => ({
    id: a.id,
    eventId: a.event.id,
    eventTitle: a.event.title,
    startTime: a.event.startTime.toISOString(),
    calendarColor: a.event.calendar.color,
  }));

  const serializedNotifications = responseNotifications.map((n: {
    id: string;
    title: string;
    eventId: string | null;
    createdAt: Date;
  }) => ({
    id: n.id,
    title: n.title,
    eventId: n.eventId,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <AppShell
      session={session}
      calendars={calendars}
      pendingInvites={serializedInvites}
      responseNotifications={serializedNotifications}
    >
      {children}
    </AppShell>
  );
}
