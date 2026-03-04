"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Calendar } from "@/lib/generated/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Search, Loader2 } from "lucide-react";
import { createEvent, updateEvent, searchUsers } from "@/actions/events";
import { toast } from "sonner";
import { format } from "date-fns";

const DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const DAY_LABELS: Record<string, string> = {
  MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu",
  FR: "Fri", SA: "Sat", SU: "Sun",
};
const FREQ_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

interface Attendee {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface EventFormProps {
  calendars: Calendar[];
  defaultCalendarId: string;
  defaultStart?: string;
  defaultEnd?: string;
  defaultAllDay?: boolean;
  // For edit mode
  eventId?: string;
  initialValues?: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    timezone: string;
    allDay: boolean;
    calendarId: string;
    rrule: string | null;
    recurrenceEnd: string | null;
  };
  initialAttendees?: Attendee[];
}

function toDatetimeLocal(iso: string) {
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

function toDateInput(iso: string) {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

export default function EventForm({
  calendars,
  defaultCalendarId,
  defaultStart,
  defaultEnd,
  defaultAllDay = false,
  eventId,
  initialValues,
  initialAttendees = [],
}: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Form state
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [allDay, setAllDay] = useState(initialValues?.allDay ?? defaultAllDay);
  const [calendarId, setCalendarId] = useState(
    initialValues?.calendarId ?? defaultCalendarId
  );
  const [timezone, setTimezone] = useState(initialValues?.timezone ?? userTz);

  const nowIso = new Date().toISOString();
  const [startTime, setStartTime] = useState(
    initialValues ? toDatetimeLocal(initialValues.startTime) : (defaultStart ? toDatetimeLocal(defaultStart) : toDatetimeLocal(nowIso))
  );
  const [endTime, setEndTime] = useState(
    initialValues ? toDatetimeLocal(initialValues.endTime) : (defaultEnd ? toDatetimeLocal(defaultEnd) : toDatetimeLocal(new Date(Date.now() + 3600000).toISOString()))
  );

  // Recurrence
  const [recurring, setRecurring] = useState(!!initialValues?.rrule);
  const [freq, setFreq] = useState("WEEKLY");
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set(["MO"]));
  const [recurrenceEnd, setRecurrenceEnd] = useState(
    initialValues?.recurrenceEnd ? toDateInput(initialValues.recurrenceEnd) : ""
  );

  // Parse existing rrule for edit mode
  useEffect(() => {
    if (initialValues?.rrule) {
      const parts = initialValues.rrule.split(";");
      for (const p of parts) {
        if (p.startsWith("FREQ=")) setFreq(p.replace("FREQ=", ""));
        if (p.startsWith("BYDAY=")) {
          setSelectedDays(new Set(p.replace("BYDAY=", "").split(",")));
        }
      }
    }
  }, []);

  // Attendee invite
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Attendee[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (attendeeSearch.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchUsers(attendeeSearch);
      setSearchResults(results.filter((r: Attendee) => !attendees.find((a) => a.id === r.id)));
      setSearching(false);
    }, 300);
  }, [attendeeSearch]);

  function buildRrule(): string | null {
    if (!recurring) return null;
    let rule = `FREQ=${freq}`;
    if (freq === "WEEKLY" && selectedDays.size > 0) {
      rule += `;BYDAY=${Array.from(selectedDays).join(",")}`;
    }
    if (recurrenceEnd) {
      rule += `;UNTIL=${recurrenceEnd.replace(/-/g, "")}T235959Z`;
    }
    return rule;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("title", title);
    fd.set("description", description);
    fd.set("startTime", allDay ? `${startTime.slice(0, 10)}T00:00:00.000Z` : new Date(startTime).toISOString());
    fd.set("endTime", allDay ? `${endTime.slice(0, 10)}T23:59:59.000Z` : new Date(endTime).toISOString());
    fd.set("timezone", timezone);
    fd.set("allDay", String(allDay));
    fd.set("calendarId", calendarId);
    const rrule = buildRrule();
    if (rrule) fd.set("rrule", rrule);
    if (recurrenceEnd) fd.set("recurrenceEnd", new Date(recurrenceEnd).toISOString());
    fd.set("attendeeEmails", JSON.stringify(attendees.map((a) => a.email)));

    startTransition(async () => {
      const result = eventId
        ? await updateEvent(eventId, fd)
        : await createEvent(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(eventId ? "Event updated" : "Event created");
        router.push("/calendar");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          required
        />
      </div>

      {/* Calendar */}
      <div className="space-y-1.5">
        <Label>Calendar</Label>
        <Select value={calendarId} onValueChange={setCalendarId}>
          <SelectTrigger>
            <SelectValue placeholder="Select calendar" />
          </SelectTrigger>
          <SelectContent>
            {calendars.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* All-day toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="allDay"
          checked={allDay}
          onCheckedChange={setAllDay}
        />
        <Label htmlFor="allDay">All day</Label>
      </div>

      {/* Date/time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Start</Label>
          <Input
            type={allDay ? "date" : "datetime-local"}
            value={allDay ? startTime.slice(0, 10) : startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>End</Label>
          <Input
            type={allDay ? "date" : "datetime-local"}
            value={allDay ? endTime.slice(0, 10) : endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Timezone */}
      {!allDay && (
        <div className="space-y-1.5">
          <Label>Timezone</Label>
          <Input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g. America/New_York"
          />
        </div>
      )}

      {/* Recurrence */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            id="recurring"
            checked={recurring}
            onCheckedChange={setRecurring}
          />
          <Label htmlFor="recurring">Repeat this event</Label>
        </div>

        {recurring && (
          <div className="pl-4 border-l-2 border-blue-200 space-y-3">
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={freq} onValueChange={setFreq}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQ_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {freq === "WEEKLY" && (
              <div className="space-y-1.5">
                <Label>Repeat on</Label>
                <div className="flex gap-1 flex-wrap">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setSelectedDays((prev) => {
                          const next = new Set(prev);
                          if (next.has(d)) next.delete(d);
                          else next.add(d);
                          return next;
                        });
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                        selectedDays.has(d)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-600 hover:border-blue-400"
                      }`}
                    >
                      {DAY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>End date (optional)</Label>
              <Input
                type="date"
                value={recurrenceEnd}
                onChange={(e) => setRecurrenceEnd(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          rows={3}
        />
      </div>

      {/* Invite attendees */}
      <div className="space-y-2">
        <Label>Invite people</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            value={attendeeSearch}
            onChange={(e) => setAttendeeSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-8"
          />
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="border rounded-md divide-y shadow-sm bg-background">
            {searchResults.map((u) => (
              <button
                key={u.id}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-sm text-left"
                onClick={() => {
                  setAttendees((prev) => [...prev, u]);
                  setAttendeeSearch("");
                  setSearchResults([]);
                }}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={u.image ?? undefined} />
                  <AvatarFallback>{(u.name ?? u.email)[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected attendees */}
        {attendees.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attendees.map((a) => (
              <Badge key={a.id} variant="secondary" className="gap-1">
                {a.name ?? a.email}
                <button
                  type="button"
                  onClick={() => setAttendees((prev) => prev.filter((x) => x.id !== a.id))}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {eventId ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  );
}
