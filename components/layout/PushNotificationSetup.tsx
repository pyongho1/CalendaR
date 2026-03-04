"use client";

import { useEffect } from "react";
import { getMessaging, getToken } from "firebase/messaging";
import { app } from "@/lib/firebase-client";
import { saveFcmToken } from "@/actions/push";

export default function PushNotificationSetup() {
  useEffect(() => {
    async function setup() {
      try {
        if (!("Notification" in window)) return;
        if (Notification.permission === "denied") return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

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
        }
      } catch {
        // Fails silently — user denied, FCM unavailable, or not a PWA context
      }
    }

    setup();
  }, []);

  return null;
}
