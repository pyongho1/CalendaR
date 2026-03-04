"use client";

import type { AppSession } from "@/lib/session";
import type { Calendar } from "@/lib/generated/prisma";
import Link from "next/link";
import { CalendarDays, Home, Plus, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarSidebarProps {
  session: AppSession;
  calendars: Calendar[];
  visibleCalendars: Set<string>;
  onToggle: (id: string) => void;
}

export default function CalendarSidebar({
  session,
  calendars,
  visibleCalendars,
  onToggle,
}: CalendarSidebarProps) {
  const personal = calendars.filter((c) => c.isPersonal);
  const group = calendars.filter((c) => !c.isPersonal);

  return (
    <div className="flex flex-col h-full p-3 gap-4">
      {/* Logo + app name */}
      <div className="flex items-center gap-2 px-1 py-2">
        <CalendarDays className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-sm">Calendar</span>
      </div>

      {/* New event button */}
      <Button asChild size="sm" className="w-full">
        <Link href="/events/new">
          <Plus className="w-4 h-4 mr-1" /> New Event
        </Link>
      </Button>

      {/* Personal calendars */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1">
          My Calendars
        </p>
        {personal.map((cal) => (
          <CalendarItem
            key={cal.id}
            calendar={cal}
            isVisible={visibleCalendars.has(cal.id)}
            onToggle={onToggle}
            showSettings={false}
          />
        ))}
      </div>

      {/* Group calendars */}
      {group.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1">
            Group Calendars
          </p>
          {group.map((cal) => (
            <CalendarItem
              key={cal.id}
              calendar={cal}
              isVisible={visibleCalendars.has(cal.id)}
              onToggle={onToggle}
              showSettings={cal.ownerId === session.userId}
            />
          ))}
        </div>
      )}

      {/* Bottom links */}
      <div className="mt-auto space-y-1">
        <Button asChild variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
          <Link href="/calendar">
            <Home className="w-4 h-4 mr-1" /> Home
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
          <Link href="/friends">
            <Users className="w-4 h-4 mr-1" /> Friends
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
          <Link href="/calendars/new">
            <Plus className="w-4 h-4 mr-1" /> New Group Calendar
          </Link>
        </Button>
      </div>
    </div>
  );
}

function CalendarItem({
  calendar,
  isVisible,
  onToggle,
  showSettings,
}: {
  calendar: Calendar;
  isVisible: boolean;
  onToggle: (id: string) => void;
  showSettings: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-accent group">
      <button
        onClick={() => onToggle(calendar.id)}
        className="flex items-center gap-2 flex-1 min-w-0"
      >
        <span
          className="w-3 h-3 rounded-sm shrink-0 transition-opacity"
          style={{
            backgroundColor: calendar.color,
            opacity: isVisible ? 1 : 0.3,
          }}
        />
        <span className="text-sm truncate">{calendar.name}</span>
      </button>
      {showSettings && (
        <Link
          href={`/calendars/${calendar.id}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
        </Link>
      )}
    </div>
  );
}
