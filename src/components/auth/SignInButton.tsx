"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn } from 'lucide-react';

export function SignInButton() {
  return (
    <Button onClick={() => signIn("google")} variant="outline" size="sm">
      <div className="flex items-center">
        <LogIn color="green" className="mr-1" /> Connexion
      </div>
    </Button>
  )
}
