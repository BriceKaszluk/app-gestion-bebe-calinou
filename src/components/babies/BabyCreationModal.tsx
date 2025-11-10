// src/components/babies/BabyCreationModal.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useBabyStore } from "@/store/useBabyStore";

type Props = {
  onCreated?: (babyId: string) => void; // rendu optionnel
};

export default function BabyCreationModal({ onCreated }: Props) {
  const { addBaby, saving } = useBabyStore();
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");

  const handleCreate = async () => {
    const n = name.trim();
    if (!n) return;
    const baby = await addBaby(n); // ✅ passe par le store (POST /api/babies/new + refresh)
    if (!baby) {
      alert("Erreur lors de la création du bébé");
      return;
    }
    setOpen(false);
    onCreated?.(baby._id);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Bienvenue sur Calinou 🍼</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-600 mb-3">
          Pour commencer, entrez le prénom de votre bébé afin de créer son profil :
        </p>

        <Input
          placeholder="Prénom du bébé"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
        />

        <Button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="mt-4 w-full flex justify-center items-center gap-2"
        >
          {saving && <Loader2 className="animate-spin w-4 h-4" />}
          {saving ? "Création..." : "Créer le profil bébé"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
