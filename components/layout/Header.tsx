"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import type { AppSession } from "@/lib/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarDays, Home, LogOut, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/layout/NotificationBell";
import type { PendingInvite, ResponseNotification } from "@/components/layout/NotificationBell";

export default function Header({
  session,
  pendingInvites,
  responseNotifications,
}: {
  session: AppSession;
  pendingInvites: PendingInvite[];
  responseNotifications: ResponseNotification[];
}) {
  const router = useRouter();
  const initials = session.name
    ? session.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (session.email?.[0] ?? "U").toUpperCase();

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-background">
      <div className="flex items-center gap-2 md:hidden">
        <CalendarDays className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-sm">Calendar</span>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="hidden md:flex">
          <Link href="/calendar">
            <Home className="w-4 h-4" />
          </Link>
        </Button>

        <Button asChild size="sm" className="hidden sm:flex">
          <Link href="/events/new">
            <Plus className="w-4 h-4 mr-1" /> New Event
          </Link>
        </Button>

        <NotificationBell pendingInvites={pendingInvites} responseNotifications={responseNotifications} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="outline-none rounded-full">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={session.image ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{session.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/calendars/new">
                <Settings className="w-4 h-4 mr-2" /> New Group Calendar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
