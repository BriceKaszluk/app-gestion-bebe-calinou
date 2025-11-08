"use client";

import { useEffect, useState } from "react";
import InviteParentDialog from "@/components/babies/InviteParentDialog";
import { useActiveBaby } from "@/hooks/useActiveBaby";
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

type Baby = {
  _id: string;
  name: string;
};

export default function BabySelector() {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [activeBaby, setActiveBaby] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  // 🔹 Récupère les bébés à la connexion
  useEffect(() => {
    const fetchBabies = async () => {
      const res = await fetch("/api/babies");
      if (!res.ok) return setLoading(false);
      const data = await res.json();
      setBabies(data);
      setLoading(false);

      const saved = localStorage.getItem("activeBabyId");
      if (saved && data.some((b: Baby) => b._id === saved)) {
        setActiveBaby(saved);
      } else if (data[0]) {
        localStorage.setItem("activeBabyId", data[0]._id);
        setActiveBaby(data[0]._id);
      }
    };
    fetchBabies();
  }, []);

  const { setActiveBabyId } = useActiveBaby();

  const handleChange = (id: string) => {
    setActiveBaby(id);
    setActiveBabyId(id);
  };

  const handleAddBaby = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/babies/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setSaving(false);
    if (!res.ok) {
      alert("Erreur lors de la création du bébé");
      return;
    }
    const baby = await res.json();
    setBabies((prev) => [...prev, baby]);
    localStorage.setItem("activeBabyId", baby._id);
    setActiveBaby(baby._id);
    window.dispatchEvent(new Event("babyChange"));
    setNewName("");
    setOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-3">
        <Loader2 className="animate-spin text-gray-400" size={20} />
      </div>
    );
  }

return (
  <div className="flex items-center gap-2 mb-4 w-full max-w-xs mx-auto">
    <Select value={activeBaby || ""} onValueChange={handleChange}>
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

    {/* ➕ Ajouter un bébé */}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" title="Ajouter un bébé">
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
          />
          <Button
            disabled={saving}
            onClick={handleAddBaby}
            className="flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="animate-spin h-4 w-4" />}
            {saving ? "Ajout..." : "Ajouter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* 👩‍👩‍👧 Inviter un parent */}
    {activeBaby && (
      <InviteParentDialog
        babyId={activeBaby}
        onInvited={(email) => alert(`Invitation envoyée à ${email}`)}
      />
    )}
  </div>
);
}
