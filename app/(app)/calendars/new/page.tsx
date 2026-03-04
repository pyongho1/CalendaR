import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import CalendarForm from "@/components/calendars/CalendarForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function NewCalendarPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Back to calendar
        </Link>
        <h1 className="text-xl font-semibold mt-3">New Group Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a shared calendar for your team or friend group.
        </p>
      </div>

      <CalendarForm />
    </div>
  );
}
