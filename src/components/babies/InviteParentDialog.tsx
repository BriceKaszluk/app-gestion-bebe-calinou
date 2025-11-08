"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus2 } from "lucide-react";

type Props = {
  babyId: string;
  onInvited?: (email: string) => void;
};

export default function InviteParentDialog({ babyId, onInvited }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);

    const res = await fetch("/api/babies/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ babyId, email }),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Erreur lors de l’invitation");
      return;
    }

    onInvited?.(email);
    setEmail("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="flex items-center justify-center"
          title="Inviter un parent"
        >
          <UserPlus2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Inviter un autre parent 👩‍👩‍👧</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-600 mb-2">
          Entrez l’adresse e-mail du parent à inviter pour partager le suivi de bébé.
        </p>

        <Input
          type="email"
          placeholder="Adresse e-mail du parent"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleInvite}
            disabled={loading || !email.trim()}
            className="flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            {loading ? "Envoi..." : "Inviter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
