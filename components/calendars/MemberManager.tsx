"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { addMember, removeMember } from "@/actions/calendars";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/generated/prisma";

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
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
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
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          <span className="ml-1 hidden sm:inline">Add</span>
        </Button>
      </form>

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
