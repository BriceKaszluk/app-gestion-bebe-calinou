"use client";

import { useEffect, useState } from "react";

export function useActiveBaby() {
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);

  useEffect(() => {
    // Charger depuis localStorage
    const saved = localStorage.getItem("activeBabyId");
    if (saved) setActiveBabyId(saved);

    // Réagir à un changement venant d'un autre composant
    const handleChange = () => {
      const id = localStorage.getItem("activeBabyId");
      setActiveBabyId(id);
    };

    window.addEventListener("babyChange", handleChange);
    return () => window.removeEventListener("babyChange", handleChange);
  }, []);

  // Fonction pratique pour changer le bébé actif
  const updateBabyId = (id: string) => {
    localStorage.setItem("activeBabyId", id);
    setActiveBabyId(id);
    window.dispatchEvent(new Event("babyChange"));
  };

  return { activeBabyId, setActiveBabyId: updateBabyId };
}
