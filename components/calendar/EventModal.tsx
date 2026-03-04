"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Edit, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { CalendarEvent } from "./CalendarClient";
import { deleteEvent } from "@/actions/events";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EventModalProps {
  event: CalendarEvent;
  onClose: () => void;
  userId: string;
}

export default function EventModal({ event, onClose, userId }: EventModalProps) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this event?")) return;
    const result = await deleteEvent(event.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Event deleted");
      onClose();
      router.refresh();
    }
  }

  const start = new Date(event.start);
  const end = new Date(event.end);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-8">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <CalendarDays className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              {event.allDay ? (
                <p>{format(start, "EEEE, MMMM d, yyyy")}</p>
              ) : (
                <p>
                  {format(start, "EEEE, MMMM d, yyyy")}
                  <br />
                  <span className="text-muted-foreground">
                    {format(start, "h:mm a")} – {format(end, "h:mm a")}
                  </span>
                </p>
              )}
            </div>
          </div>

          {event.rrule && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>Recurring event</span>
            </div>
          )}

          {event.timezone && event.timezone !== "UTC" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{event.timezone}</span>
            </div>
          )}

          {event.description && (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
          <Button asChild size="sm">
            <Link href={`/events/${event.id}/edit`} onClick={onClose}>
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
