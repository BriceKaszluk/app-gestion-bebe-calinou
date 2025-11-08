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

type Baby = { _id: string; name: string };

export default function BabySelector() {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [activeBaby, setActiveBaby] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const { setActiveBabyId } = useActiveBaby();

  // 🔁 Fonction réutilisable pour recharger la liste
  const reloadBabies = async () => {
    const res = await fetch("/api/babies");
    const data = await res.json();
    setBabies(data);

    const saved = localStorage.getItem("activeBabyId");
    if (!data.some((b: Baby) => b._id === saved)) {
      localStorage.removeItem("activeBabyId");
      setActiveBaby(null);
      setActiveBabyId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchBabies = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/babies");
        if (!res.ok) throw new Error("Erreur récupération bébés");
        const data = await res.json();
        if (cancelled) return;
        setBabies(data);

        const saved = localStorage.getItem("activeBabyId");
        if (data.length === 0) {
          localStorage.removeItem("activeBabyId");
          setActiveBaby(null);
          setActiveBabyId(null);
          return;
        }

        const validBaby = data.find((b: Baby) => b._id === saved);
        if (validBaby) {
          setActiveBaby(validBaby._id);
          const current = localStorage.getItem("activeBabyId");
          if (current !== validBaby._id) {
            setActiveBabyId(validBaby._id);
          }
        } else {
          const first = data[0]._id;
          localStorage.setItem("activeBabyId", first);
          setActiveBaby(first);
          setActiveBabyId(first);
        }
      } catch (err) {
        console.error("Erreur chargement bébés:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBabies();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (id: string) => {
    if (id === activeBaby) return;
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
    setActiveBabyId(baby._id);
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

      {activeBaby && (
        <InviteParentDialog
          babyId={activeBaby}
          onInvited={async (email) => {
            alert(`Invitation envoyée à ${email}`);
            await reloadBabies(); // 💡 recharge la liste
          }}
        />
      )}
    </div>
  );
}
