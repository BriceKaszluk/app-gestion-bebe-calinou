"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  return (
  <Button onClick={() => signOut()} variant="outline" size="sm">
    <div className="flex items-center">
      <LogOut color="red" className="mr-1" /> Se Déconnecter
    </div>
  </Button>
  )
}