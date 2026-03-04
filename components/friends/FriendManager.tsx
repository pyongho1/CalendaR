"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserMinus, UserPlus, Clock } from "lucide-react";
import { sendFriendInvite, removeFriend } from "@/actions/friends";
import { toast } from "sonner";

interface FriendUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface FriendInvite {
  id: string;
  toEmail: string;
  acceptedAt: Date | null;
  from: FriendUser;
  to: FriendUser | null;
}

interface FriendManagerProps {
  userId: string;
  friends: FriendInvite[];
  pending: FriendInvite[];
}

function getInitials(name: string | null, email: string) {
  return name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : email[0].toUpperCase();
}

export default function FriendManager({ userId, friends, pending }: FriendManagerProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(async () => {
      const result = await sendFriendInvite(email.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Friend invite sent!");
        setEmail("");
        router.refresh();
      }
    });
  }

  function handleRemove(inviteId: string, name: string) {
    if (!confirm(`Remove ${name} from your friends?`)) return;
    startTransition(async () => {
      const result = await removeFriend(inviteId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Friend removed");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Add friend form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter friend's email address"
          className="flex-1"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          <span className="ml-1.5">Add Friend</span>
        </Button>
      </form>

      {/* Friends list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Friends {friends.length > 0 && `· ${friends.length}`}
        </h2>

        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No friends yet. Add someone above to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((invite) => {
              const friend = invite.fromId === userId ? invite.to! : invite.from;
              const initials = getInitials(friend.name, friend.email);
              return (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={friend.image ?? undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {friend.name ?? friend.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {friend.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleRemove(invite.id, friend.name ?? friend.email)}
                    disabled={isPending}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending invites */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pending · {pending.length}
          </h2>
          <div className="space-y-2">
            {pending.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 rounded-lg border border-dashed"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{invite.toEmail}</p>
                    <p className="text-xs text-muted-foreground">Invite sent · awaiting sign-in</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemove(invite.id, invite.toEmail)}
                  disabled={isPending}
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
