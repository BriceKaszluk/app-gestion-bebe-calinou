"use client"

import { useSession } from "next-auth/react"
import { SignInButton } from "./SignInButton";
import { SignOutButton } from "./SignOutButton";
import { Button } from "@/components/ui/button"
import { Loader2Icon } from "lucide-react"

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
    <Button size="sm" disabled>
      <Loader2Icon className="animate-spin" />
      Chargement...
    </Button>
    )
  }

  return session ? (
    <SignOutButton />
  ) : (
    <SignInButton />
  )
}
