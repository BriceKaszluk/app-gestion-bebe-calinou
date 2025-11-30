"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import interfacePreview from "@/public/interface-exemple.png";
import { Timer, Camera, Users, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import OfflineOverlay from "@/components/pwa/OfflineOverlay";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/auth/tableau-de-bord"); // ✅ aligne partout ce chemin
    }
  }, [status, router]);

  if (status === "loading") return null;

  return (
    <main className="relative min-h-screen">
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-16">
        <h1 className="sr-only">Calinou — journal et suivi bébé</h1>

        <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
          <div className="text-center sm:text-left">
            <p className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
              PWA — fonctionne hors-ligne
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Le journal bébé pensé pour les parents pressés
            </h2>
            <p className="mt-3 text-gray-600">
              Démarrez un dodo, enregistrez un biberon, ajoutez une photo — tout est
              synchronisé et accessible à deux.
            </p>

            <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:items-stretch">
              <Button
                className="w-full sm:w-auto"
                onClick={() => signIn("google", { callbackUrl: "/auth/tableau-de-bord" })}
              >
                Commencer
              </Button>
            </div>

            {!isOnline && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded">
                <WifiOff className="h-4 w-4" />
                Vous êtes hors-ligne — l’app reste utilisable.
              </p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-3">
              <FeatureMini icon={<Timer className="h-5 w-5" />} title="Timers instantanés" />
              <FeatureMini icon={<Camera className="h-5 w-5" />} title="Journal photo" />
              <FeatureMini icon={<Users className="h-5 w-5" />} title="Co-parent" />
            </div>

            <div className="mt-4 overflow-hidden rounded-xl">
              <div className="relative aspect-[16/10] sm:aspect-[4/3]">
                <Image
                  src={interfacePreview}
                  alt="Aperçu de l’interface Calinou"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
                  className="object-cover"
                  placeholder="blur"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <OfflineOverlay isOnline={isOnline} onRetry={() => window.location.reload()} />
    </main>
  );
}

function FeatureMini({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm">
      <span className="text-gray-700">{icon}</span>
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}
