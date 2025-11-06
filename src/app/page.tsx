"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import OfflineOverlay from "@/components/OfflineOverlay";

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter();
  const isOnline = useOnlineStatus();

  // 💡 Redirige si connecté
  useEffect(() => {
    if (status === "authenticated" || session) {
      router.replace("/auth/tableau-de-bord"); // ton tableau de bord
    }
  }, [status, router, session]);

  // 💡 Évite un flash avant que le statut soit connu
  if (status === "loading") return null;

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen p-6 sm:p-8">
      <h1 className="text-2xl font-semibold mb-3">
        Bienvenue sur Calinou 🍼
      </h1>
      <p className="text-muted-foreground text-center max-w-md">
        Suivez les moments de votre bébé, même en déplacement.
      </p>

      <OfflineOverlay
        isOnline={isOnline}
        onRetry={() => window.location.reload()}
      />
    </main>
  );
}
