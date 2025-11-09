// src/components/babies/InviteParentDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useBabyStore } from "@/store/useBabyStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus } from "lucide-react";

type Props = { babyId: string; onInvited?: (email: string) => void };

const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.toLowerCase());

export default function InviteParentDialog({ babyId, onInvited }: Props) {
  const { inviteParent, loadBabies } = useBabyStore();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);

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

  const submit = async () => {
    const value = email.trim().toLowerCase();
    if (!isValidEmail(value)) {
      alert("Email invalide");
      return;
    }
    setLoading(true);
    try {
      await inviteParent(babyId, value);
      onInvited?.(value);
      setOpen(false);
      setEmail("");
      void loadBabies();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur d’invitation";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !isValidEmail(email.trim()) || !online;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="whitespace-nowrap" disabled={!online}>
          <UserPlus className="h-4 w-4 mr-1" /> Inviter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Inviter un parent</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="email@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !disabled) void submit();
            }}
          />
          <Button disabled={disabled} onClick={() => void submit()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer"}
          </Button>
        </div>
        {!online && (
          <p className="text-xs text-amber-600 mt-2">
            Hors-ligne — réessaie quand la connexion revient.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
