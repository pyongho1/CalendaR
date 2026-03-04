"use client";

import { useState, useEffect } from "react";
import type { AppSession } from "@/lib/session";
import type { Calendar } from "@/lib/generated/prisma";
import type { PendingInvite, ResponseNotification } from "@/components/layout/NotificationBell";
import CalendarSidebar from "@/components/calendars/CalendarSidebar";
import Header from "@/components/layout/Header";
import MobileSidebar from "@/components/layout/MobileSidebar";
import PushNotificationSetup from "@/components/layout/PushNotificationSetup";

interface AppShellProps {
  session: AppSession;
  calendars: Calendar[];
  pendingInvites: PendingInvite[];
  responseNotifications: ResponseNotification[];
  children: React.ReactNode;
}

export default function AppShell({ session, calendars, pendingInvites, responseNotifications, children }: AppShellProps) {
  const [visibleCalendars, setVisibleCalendars] = useState<Set<string>>(
    new Set(calendars.map((c) => c.id))
  );

  useEffect(() => {
    setVisibleCalendars((prev) => {
      const newIds = calendars.map((c) => c.id).filter((id) => !prev.has(id));
      if (newIds.length === 0) return prev;
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });
  }, [calendars]);

  function toggleCalendar(id: string) {
    setVisibleCalendars((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PushNotificationSetup />
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r shrink-0">
        <CalendarSidebar
          session={session}
          calendars={calendars}
          visibleCalendars={visibleCalendars}
          onToggle={toggleCalendar}
        />
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header session={session} pendingInvites={pendingInvites} responseNotifications={responseNotifications} />
        <main className="flex-1 overflow-auto">
          <VisibleCalendarsContext.Provider value={visibleCalendars}>
            {children}
          </VisibleCalendarsContext.Provider>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileSidebar
        session={session}
        calendars={calendars}
        visibleCalendars={visibleCalendars}
        onToggle={toggleCalendar}
      />
    </div>
  );
}

import { createContext, useContext } from "react";

export const VisibleCalendarsContext = createContext<Set<string>>(new Set());

export function useVisibleCalendars() {
  return useContext(VisibleCalendarsContext);
}
