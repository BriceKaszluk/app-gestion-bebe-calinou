"use client";

import Link from "next/link";
import { Baby } from "lucide-react";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import { AuthButton } from "@/components/auth/AuthButton";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-4 py-3 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Baby className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">Calinou</span>
        </Link>

        <div className="flex items-center gap-2">
          <InstallAppButton />
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
