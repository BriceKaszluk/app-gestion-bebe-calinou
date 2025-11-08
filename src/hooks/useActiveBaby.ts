"use client";

import { useEffect, useState } from "react";

export function useActiveBaby() {
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);

  useEffect(() => {
    // 🔹 Charger le bébé actif depuis le localStorage
    const saved = localStorage.getItem("activeBabyId");
    if (saved) setActiveBabyId(saved);

    // 🔹 Écoute les changements globaux (d’un autre onglet ou composant)
    const handleChange = () => {
      const id = localStorage.getItem("activeBabyId");
      setActiveBabyId(id);
    };

    window.addEventListener("babyChange", handleChange);
    return () => window.removeEventListener("babyChange", handleChange);
  }, []);

  // ✅ Mise à jour centralisée et synchronisée
  const updateBabyId = (id: string | null) => {
    if (id) {
      localStorage.setItem("activeBabyId", id);
    } else {
      localStorage.removeItem("activeBabyId");
    }
    setActiveBabyId(id);
    window.dispatchEvent(new Event("babyChange"));
  };

  return { activeBabyId, setActiveBabyId: updateBabyId };
}
