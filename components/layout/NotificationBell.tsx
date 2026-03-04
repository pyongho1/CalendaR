"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { respondToEventInvite, dismissNotification } from "@/actions/invites";
import { toast } from "sonner";
import { format } from "date-fns";

export interface PendingInvite {
  id: string;
  eventId: string;
  eventTitle: string;
  startTime: string;
  calendarColor: string;
}

export interface ResponseNotification {
  id: string;
  title: string;
  eventId: string | null;
  createdAt: string;
}

interface NotificationBellProps {
  pendingInvites: PendingInvite[];
  responseNotifications: ResponseNotification[];
}

export default function NotificationBell({ pendingInvites, responseNotifications }: NotificationBellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const totalCount = pendingInvites.length + responseNotifications.length;

  function handleRespond(eventId: string, status: "accepted" | "declined") {
    startTransition(async () => {
      const result = await respondToEventInvite(eventId, status);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(status === "accepted" ? "Invite accepted" : "Invite declined");
        router.refresh();
      }
    });
  }

  function handleDismiss(id: string) {
    startTransition(async () => {
      const result = await dismissNotification(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative outline-none rounded-md p-1.5 hover:bg-accent transition-colors">
          <Bell className="w-5 h-5" />
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
              {totalCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">Notifications</p>
        </div>

        {totalCount === 0 ? (
          <p className="text-sm text-muted-foreground px-4 py-6 text-center">
            No notifications
          </p>
        ) : (
          <div className="divide-y max-h-80 overflow-y-auto">
            {/* Pending invites — require action */}
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="px-4 py-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0 mt-1"
                    style={{ backgroundColor: invite.calendarColor }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{invite.eventTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(invite.startTime), "EEE, MMM d · h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pl-4">
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    disabled={isPending}
                    onClick={() => handleRespond(invite.eventId, "accepted")}
                  >
                    <Check className="w-3 h-3 mr-1" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1"
                    disabled={isPending}
                    onClick={() => handleRespond(invite.eventId, "declined")}
                  >
                    <X className="w-3 h-3 mr-1" /> Decline
                  </Button>
                </div>
              </div>
            ))}

            {/* Response notifications — informational, dismissible */}
            {responseNotifications.map((notif) => (
              <div key={notif.id} className="px-4 py-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm truncate">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(notif.createdAt), "MMM d · h:mm a")}
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(notif.id)}
                  disabled={isPending}
                  className="shrink-0 p-1 rounded hover:bg-accent text-muted-foreground transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
