"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Props = {
  onCreated: (babyId: string) => void;
};

export default function BabyCreationModal({ onCreated }: Props) {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const res = await fetch("/api/babies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setSaving(false);
    if (!res.ok) {
      alert("Erreur lors de la création du bébé");
      return;
    }

    const data = await res.json();
    localStorage.setItem("activeBabyId", data.babyId);
    setOpen(false);
    onCreated(data.babyId);
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
