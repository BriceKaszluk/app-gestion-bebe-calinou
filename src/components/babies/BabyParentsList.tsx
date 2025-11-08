"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";

type Parent = { email: string };
type Baby = { _id: string; name: string; parents: Parent[] };

export default function BabyParentsList({ babyId }: { babyId: string }) {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 🔹 Charge les infos du bébé et l'utilisateur connecté
  useEffect(() => {
    const load = async () => {
      try {
        const userRes = await fetch("/api/user");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserEmail(userData.email);
        }

        const res = await fetch(`/api/babies/${babyId}`);
        if (!res.ok) throw new Error("Erreur récupération bébé");

        const data = await res.json();
        setBaby(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (babyId) load();
  }, [babyId]);

  const handleRemove = async (email: string) => {
    if (!confirm(`Retirer ${email} de ce bébé ?`)) return;
    setRemoving(email);

    const res = await fetch("/api/babies/invite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ babyId, email }),
    });

    if (res.ok) {
      setBaby((prev) =>
        prev
          ? { ...prev, parents: prev.parents.filter((p) => p.email !== email) }
          : prev
      );
    } else {
      const err = await res.json();
      alert(err.error || "Erreur lors de la révocation");
    }

    setRemoving(null);
  };

  if (loading)
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="animate-spin text-gray-400" size={20} />
      </div>
    );

  if (!baby)
    return (
      <p className="text-center text-sm text-gray-500">
        Impossible de charger les parents du bébé.
      </p>
    );

  const creator = baby.parents[0]?.email;
  const isCreator = userEmail === creator;

  return (
    <Card className="p-4 space-y-3 bg-white shadow-sm mb-6">
      <h2 className="font-semibold text-lg text-center">
        Parents de {baby.name}
      </h2>

      <ul className="divide-y divide-gray-200">
        {baby.parents.map((parent) => (
          <li
            key={parent.email}
            className="flex justify-between items-center py-2"
          >
            <span
              className={`text-sm ${
                parent.email === creator ? "font-semibold" : ""
              }`}
            >
              {parent.email}
              {parent.email === creator && (
                <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                  Créateur
                </span>
              )}
            </span>

            {isCreator && parent.email !== creator && (
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleRemove(parent.email)}
                disabled={removing === parent.email}
              >
                {removing === parent.email ? (
                  <Loader2 className="animate-spin h-4 w-4 text-gray-400" />
                ) : (
                  <Trash2 className="h-4 w-4 text-red-500" />
                )}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
