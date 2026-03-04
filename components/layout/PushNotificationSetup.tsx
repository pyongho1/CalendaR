"use client";

import { useEffect, useState } from "react";
import { getMessaging, getToken } from "firebase/messaging";
import { app } from "@/lib/firebase-client";
import { saveFcmToken } from "@/actions/push";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PushNotificationSetup() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem("push_dismissed")) return;
    setShowBanner(true);
  }, []);

  function dismiss() {
    localStorage.setItem("push_dismissed", "1");
    setShowBanner(false);
  }

  async function enable() {
    setShowBanner(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notifications blocked. You can enable them in browser settings.");
        return;
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" }
      );

      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        await saveFcmToken(token);
        toast.success("Notifications enabled");
      }
    } catch {
      toast.error("Failed to enable notifications.");
    }
  }

  if (!showBanner) return null;

  return (
    <div className="bg-muted border-b px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Bell className="h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">Enable push notifications?</p>
          <p className="text-xs text-muted-foreground">
            Get notified when group events change.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={dismiss}>
          Not now
        </Button>
        <Button size="sm" onClick={enable}>
          Enable
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
