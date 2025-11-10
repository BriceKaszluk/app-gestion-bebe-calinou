"use client";

import { useState } from "react";
import { useBabyStore } from "@/store/useBabyStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users } from "lucide-react";
import BabyParentsList from "@/components/babies/BabyParentsList";
import InviteParentDialog from "@/components/babies/InviteParentDialog";

export default function ManageParentsDialog() {
  const { activeBaby } = useBabyStore();
  const [open, setOpen] = useState(false);

  const disabled = !activeBaby;

  return (
    <div className="flex items-center gap-2 mb-4 max-w-sm mx-auto">
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="whitespace-nowrap">
          <Users className="h-4 w-4 mr-2" />
          Parents & accès
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Parents & accès</DialogTitle>
          {activeBaby && (
            <InviteParentDialog babyId={activeBaby._id} />
          )}
        </DialogHeader>

        {/* Liste et actions (suppression) */}
        <BabyParentsList />
      </DialogContent>
    </Dialog>
    </div>
  );
}
