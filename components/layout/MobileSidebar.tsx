"use client";

import { useState } from "react";
import type { AppSession } from "@/lib/session";
import type { Calendar } from "@/lib/generated/prisma";
import Link from "next/link";
import { CalendarDays, Plus, UserCheck, Users, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CalendarSidebar from "@/components/calendars/CalendarSidebar";

interface MobileSidebarProps {
  session: AppSession;
  calendars: Calendar[];
  visibleCalendars: Set<string>;
  onToggle: (id: string) => void;
}

export default function MobileSidebar({
  session,
  calendars,
  visibleCalendars,
  onToggle,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex items-center justify-around h-14 z-40 px-2">
        <Link href="/calendar" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
          <CalendarDays className="w-5 h-5" />
          <span>Calendar</span>
        </Link>
        <Link href="/events/new" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
          <Plus className="w-5 h-5" />
          <span>New</span>
        </Link>
        <Link href="/calendars/new" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
          <Users className="w-5 h-5" />
          <span>Groups</span>
        </Link>
        <Link href="/friends" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
          <UserCheck className="w-5 h-5" />
          <span>Friends</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {/* Slide-over panel */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative ml-auto w-72 bg-background h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Calendars</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <CalendarSidebar
                session={session}
                calendars={calendars}
                visibleCalendars={visibleCalendars}
                onToggle={onToggle}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
