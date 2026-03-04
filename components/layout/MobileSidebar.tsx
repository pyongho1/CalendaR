"use client";

import { useState } from "react";
import type { AppSession } from "@/lib/session";
import type { Calendar } from "@/lib/generated/prisma";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Plus, UserCheck, Users, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CalendarSidebar from "@/components/calendars/CalendarSidebar";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();

  const navItemClass = (active: boolean) =>
    cn(
      "flex flex-col items-center gap-0.5 min-w-0 px-3 py-1 rounded-xl transition-all duration-150 active:scale-90 active:opacity-70",
      active
        ? "text-primary"
        : "text-muted-foreground"
    );

  return (
    <>
      {/* Bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex items-center justify-around h-14 z-40 px-2">
        <Link href="/calendar" className={navItemClass(pathname === "/calendar")}>
          <div className={cn("p-1 rounded-lg transition-colors duration-150", pathname === "/calendar" && "bg-primary/10")}>
            <CalendarDays className="w-5 h-5" />
          </div>
          <span className={cn("text-[10px] font-medium truncate whitespace-nowrap", pathname === "/calendar" && "font-semibold")}>Calendar</span>
        </Link>
        <Link href="/events/new" className={navItemClass(pathname === "/events/new")}>
          <div className={cn("p-1 rounded-lg transition-colors duration-150", pathname === "/events/new" && "bg-primary/10")}>
            <Plus className="w-5 h-5" />
          </div>
          <span className={cn("text-[10px] font-medium truncate whitespace-nowrap", pathname === "/events/new" && "font-semibold")}>New</span>
        </Link>
        <Link href="/calendars/new" className={navItemClass(pathname.startsWith("/calendars"))}>
          <div className={cn("p-1 rounded-lg transition-colors duration-150", pathname.startsWith("/calendars") && "bg-primary/10")}>
            <Users className="w-5 h-5" />
          </div>
          <span className={cn("text-[10px] font-medium truncate whitespace-nowrap", pathname.startsWith("/calendars") && "font-semibold")}>Groups</span>
        </Link>
        <Link href="/friends" className={navItemClass(pathname.startsWith("/friends"))}>
          <div className={cn("p-1 rounded-lg transition-colors duration-150", pathname.startsWith("/friends") && "bg-primary/10")}>
            <UserCheck className="w-5 h-5" />
          </div>
          <span className={cn("text-[10px] font-medium truncate whitespace-nowrap", pathname.startsWith("/friends") && "font-semibold")}>Friends</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className={navItemClass(open)}
        >
          <div className={cn("p-1 rounded-lg transition-colors duration-150", open && "bg-primary/10")}>
            <Menu className="w-5 h-5" />
          </div>
          <span className={cn("text-[10px] font-medium truncate whitespace-nowrap", open && "font-semibold")}>More</span>
        </button>
      </nav>

      {/* Slide-over panel */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative ml-auto w-[85vw] max-w-xs bg-background h-full flex flex-col shadow-xl">
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
