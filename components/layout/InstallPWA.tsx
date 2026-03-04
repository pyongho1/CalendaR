"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Already installed as a standalone PWA — hide the button
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setHidden(true);
      return;
    }

    // iOS Safari doesn't support beforeinstallprompt
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // Android / Chrome — capture the deferred prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setHidden(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!mounted || hidden) return null;
  // On Android, only show once the browser fires the install event
  if (!isIOS && !deferredPrompt) return null;

  async function handlePress() {
    if (isIOS) {
      setShowInstructions((v) => !v);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setHidden(true);
      setDeferredPrompt(null);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePress}
        aria-label="Add to home screen"
        className="md:hidden"
      >
        <Download className="w-4 h-4" />
      </Button>

      {/* iOS instructions card — sits just above the mobile nav bar */}
      {showInstructions && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setShowInstructions(false)}
          />
          {/* Card */}
          <div className="fixed inset-x-3 bottom-16 z-50 bg-background border rounded-2xl shadow-2xl p-4 md:hidden">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <p className="font-semibold text-sm">Add to Home Screen</p>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tap the{" "}
              <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                <Share className="w-3.5 h-3.5" /> Share
              </span>{" "}
              button in your browser, then tap{" "}
              <strong className="text-foreground">"Add to Home Screen"</strong>{" "}
              to install the app.
            </p>
          </div>
        </>
      )}
    </>
  );
}
