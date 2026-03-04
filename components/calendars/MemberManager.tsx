"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { addMember, removeMember } from "@/actions/calendars";
import { searchUsers } from "@/actions/events";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/generated/prisma";

interface UserResult {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: Date;
  user: User;
}

interface MemberManagerProps {
  calendarId: string;
  members: Member[];
}

export default function MemberManager({ calendarId, members }: MemberManagerProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (email.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchUsers(email);
      const memberUserIds = new Set(members.map((m) => m.userId));
      setSearchResults(results.filter((r: UserResult) => !memberUserIds.has(r.id)));
      setSearching(false);
    }, 300);
  }, [email]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSearchResults([]);
    startTransition(async () => {
      const result = await addMember(calendarId, email.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Member added and invitation sent");
        setEmail("");
        router.refresh();
      }
    });
  }

  function handleSelectUser(user: UserResult) {
    setSearchResults([]);
    setEmail("");
    startTransition(async () => {
      const result = await addMember(calendarId, user.email);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Member added and invitation sent");
        router.refresh();
      }
    });
  }

  function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this calendar?`)) return;
    startTransition(async () => {
      const result = await removeMember(calendarId, userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Member removed");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Add member form */}
      <div className="space-y-1">
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1"
              autoComplete="off"
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button type="submit" size="sm" disabled={isPending || !email.trim()}>
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span className="ml-1 hidden sm:inline">Add</span>
          </Button>
        </form>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="border rounded-md divide-y shadow-sm bg-background">
            {searchResults.map((u) => (
              <button
                key={u.id}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-sm text-left"
                onClick={() => handleSelectUser(u)}
                disabled={isPending}
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={u.image ?? undefined} />
                  <AvatarFallback>{(u.name ?? u.email)[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {members.map((m) => {
          const initials = m.user.name
            ? m.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
            : (m.user.email?.[0] ?? "U").toUpperCase();

          return (
            <div
              key={m.id}
              className="flex items-center justify-between p-2 rounded-md border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={m.user.image ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.user.name ?? m.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={m.role === "owner" ? "default" : "secondary"}>
                  {m.role}
                </Badge>
                {m.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(m.userId, m.user.name ?? m.user.email ?? "")}
                    disabled={isPending}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
