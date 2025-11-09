// src/components/babies/BabyParentsList.tsx
"use client";

import { useEffect, useState } from "react";
import { useBabyStore } from "@/store/useBabyStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";

type UserResponse = { email: string };

export default function BabyParentsList() {
  const { activeBaby, loadingBabies, revokeParent } = useBabyStore();

  const [removing, setRemoving] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  // Email de l'utilisateur connecté
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/user", { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as UserResponse;
        setUserEmail(typeof data?.email === "string" ? data.email : null);
      } catch {
        // offline/abort
      }
    })();
    return () => controller.abort();
  }, []);

  // Garde offline
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const parents = activeBaby?.parents ?? [];
  const creator: string | null = parents.length > 0 ? parents[0].email : null;
  const isCreator = userEmail !== null && userEmail === creator;

  if (loadingBabies || !activeBaby) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="animate-spin text-gray-400" size={20} />
      </div>
    );
  }

  const { name, _id: babyId } = activeBaby;

  const handleRemove = async (email: string) => {
    if (!confirm(`Retirer ${email} de ce bébé ?`)) return;
    setRemoving(email);
    try {
      await revokeParent(babyId, email);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      console.error(e);
      alert(`Erreur lors de la révocation du parent: ${msg}`);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Card className="p-4 space-y-3 bg-white shadow-sm mb-6">
      <h2 className="font-semibold text-lg text-center">Parents de {name}</h2>

      {parents.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-2">
          Aucun parent associé.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {parents.map((parent) => {
            const isCreatorBadge = creator !== null && parent.email === creator;
            const canRemove = isCreator && !isCreatorBadge;

            return (
              <li
                key={parent.email}
                className="flex justify-between items-center py-2"
              >
                <span className={`text-sm ${isCreatorBadge ? "font-semibold" : ""}`}>
                  {parent.email}
                  {isCreatorBadge && (
                    <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                      Créateur
                    </span>
                  )}
                </span>

                {canRemove && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => void handleRemove(parent.email)}
                    disabled={removing === parent.email || !online}
                    aria-label={`Retirer ${parent.email}`}
                  >
                    {removing === parent.email ? (
                      <Loader2 className="animate-spin h-4 w-4 text-gray-400" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
