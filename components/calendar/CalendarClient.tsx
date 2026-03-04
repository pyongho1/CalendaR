"use client";

import { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";
import { useVisibleCalendars } from "@/components/layout/AppShell";
import EventModal from "@/components/calendar/EventModal";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutList, CalendarDays } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  rrule?: string;
  color: string;
  calendarId: string;
  timezone: string;
  description?: string;
}

interface CalendarClientProps {
  events: CalendarEvent[];
  userId: string;
}

export default function CalendarClient({ events, userId }: CalendarClientProps) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);
  const visibleCalendars = useVisibleCalendars();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "calendar">("list");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    setMounted(true);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.changeView(
      isMobile
        ? mobileView === "list"
          ? "listWeek"
          : "dayGridMonth"
        : "dayGridMonth"
    );
  }, [mobileView, isMobile, mounted]);

  const filteredEvents = events
    .filter((e) => visibleCalendars.has(e.calendarId))
    .map((e) => {
      if (e.rrule) {
        return {
          id: e.id,
          title: e.title,
          allDay: e.allDay,
          rrule: e.rrule,
          duration: computeDuration(e.start, e.end),
          color: e.color,
          extendedProps: { calendarId: e.calendarId, description: e.description, timezone: e.timezone, originalEvent: e },
        };
      }
      return {
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        color: e.color,
        extendedProps: { calendarId: e.calendarId, description: e.description, timezone: e.timezone, originalEvent: e },
      };
    });

  function handleEventClick(arg: EventClickArg) {
    const original = arg.event.extendedProps.originalEvent as CalendarEvent;
    setSelectedEvent(original);
  }

  function handleDateSelect(arg: DateSelectArg) {
    const start = arg.startStr;
    const end = arg.endStr;
    router.push(`/events/new?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&allDay=${arg.allDay}`);
  }

  return (
    <>
      <div className="h-full flex flex-col">
        {mounted && isMobile && (
          <div className="flex justify-center py-2 px-4 border-b shrink-0">
            <div className="flex rounded-full bg-muted p-1 gap-1">
              <button
                onClick={() => setMobileView("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                  mobileView === "list"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutList className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setMobileView("calendar")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                  mobileView === "calendar"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Calendar
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0 [&_.fc]:h-full [&_.fc-toolbar-title]:text-base [&_.fc-toolbar-title]:font-semibold [&_.fc-button]:text-xs [&_.fc-button]:capitalize [&_.fc-toolbar-title]:text-sm [&_.fc-list-day-cushion]:bg-muted/40 [&_.fc-list-event]:cursor-pointer [&_.fc-list-event-title]:font-medium [&_.fc-list-event-time]:text-muted-foreground [&_.fc-list-event-time]:text-xs">
          {mounted ? (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin, listPlugin]}
              initialView={isMobile ? "listWeek" : "dayGridMonth"}
              headerToolbar={isMobile ? {
                left: "prev,next",
                center: "title",
                right: "today",
              } : {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              selectable
              selectMirror
              dayMaxEvents
              weekends
              events={filteredEvents}
              eventClick={handleEventClick}
              select={handleDateSelect}
              height="100%"
              eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
            />
          ) : (
            <div className="h-full bg-muted/20 animate-pulse rounded-md" />
          )}
        </div>
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          userId={userId}
        />
      )}
    </>
  );
}

function computeDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
