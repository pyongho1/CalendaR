import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import CalendarForm from "@/components/calendars/CalendarForm";
import MemberManager from "@/components/calendars/MemberManager";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default async function CalendarSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const { id } = await params;

  const calendar = await prisma.calendar.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!calendar) notFound();
  if (calendar.ownerId !== session.userId) redirect("/calendar");
  if (calendar.isPersonal) redirect("/calendar");

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-8 pb-24 md:pb-8">
      <div>
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Back to calendar
        </Link>
        <h1 className="text-xl font-semibold mt-3">Calendar Settings</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-base font-medium">Details</h2>
        <CalendarForm
          calendarId={calendar.id}
          initialValues={{
            name: calendar.name,
            description: calendar.description ?? "",
            color: calendar.color,
          }}
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-base font-medium">Members</h2>
        <MemberManager calendarId={calendar.id} members={calendar.members} />
      </section>
    </div>
  );
}
