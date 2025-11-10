"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    const mq = window.matchMedia("(display-mode: standalone)");
    const isIOSStandalone =
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(mq.matches || isIOSStandalone);

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  const canInstall = Boolean(deferredPrompt && !isStandalone);
  if (!canInstall) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleInstall}>
      Installer l’app
    </Button>
  );
}
