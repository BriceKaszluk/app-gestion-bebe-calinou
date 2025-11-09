"use client";
import { useState } from "react";
import { useBabyStore } from "@/store/useBabyStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";

type Props = { babyId: string; email: string; onRemoved?: () => void };

export default function RemoveParentDialog({ babyId, email, onRemoved }: Props) {
  const { revokeParent } = useBabyStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    setLoading(true);
    try {
      await revokeParent(babyId, email);
      onRemoved?.();
      setOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de la révocation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="icon" aria-label={`Retirer ${email}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Retirer {email} ?</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="destructive" onClick={() => void remove()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
