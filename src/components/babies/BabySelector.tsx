// src/components/babies/BabySelector.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useBabyStore } from "@/store/useBabyStore";

export default function BabySelector() {
  const { babies, activeBaby, loadingBabies, saving, init, addBaby, setActiveBabyId } =
    useBabyStore();

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    void init(); // init unique (le store gère le garde interne)
  }, [init]);

  if (loadingBabies) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
        <Loader2 className="animate-spin h-4 w-4" />
        Chargement des bébés…
      </div>
    );
  }

  const handleSelect = (id: string) => {
    void setActiveBabyId(id);
  };

  const handleCreate = async (): Promise<void> => {
    const name = newName.trim();
    if (!name) return;
    const created = await addBaby(name);
    if (created) {
      setNewName("");
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-4 w-full max-w-sm mx-auto">
      <Select
        value={activeBaby?._id ?? ""}
        onValueChange={handleSelect}
        disabled={babies.length === 0}
      >
        <SelectTrigger className="w-full bg-white border border-gray-200 shadow-sm">
          <SelectValue placeholder="Sélectionner un bébé" />
        </SelectTrigger>
        <SelectContent>
          {babies.map((b) => (
            <SelectItem key={b._id} value={b._id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Ajouter un bébé */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            title="Ajouter un bébé"
            aria-label="Ajouter un bébé"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau bébé 🍼</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-3">
            <Input
              placeholder="Prénom du bébé"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim() && !saving) {
                  void handleCreate();
                }
              }}
              disabled={saving}
            />
            <Button
              disabled={saving || newName.trim().length === 0}
              onClick={() => void handleCreate()}
              className="flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="animate-spin h-4 w-4" />}
              {saving ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
