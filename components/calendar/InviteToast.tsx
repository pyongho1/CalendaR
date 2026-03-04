"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function InviteToast({ status }: { status: string }) {
  useEffect(() => {
    const messages: Record<string, { type: "success" | "error"; text: string }> = {
      accepted: { type: "success", text: "Invite accepted! The event is on your calendar." },
      declined: { type: "error", text: "Invite declined." },
      invalid: { type: "error", text: "This invite link is invalid." },
      expired: { type: "error", text: "This invite link has expired." },
      "already-used": { type: "error", text: "This invite link has already been used." },
    };

    const msg = messages[status];
    if (msg) {
      if (msg.type === "success") toast.success(msg.text);
      else toast.error(msg.text);
    }
  }, [status]);

  return null;
}
