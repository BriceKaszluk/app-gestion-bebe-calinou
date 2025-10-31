"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // ⏳ Pendant le chargement
  if (status === "loading") {
    return <p>Chargement de la session...</p>;
  }

  // ❌ Si l'utilisateur n'est pas connecté
  if (status === "unauthenticated" || !session) {
    redirect("/"); // ou return <p>Non autorisé</p>
  }

  // ✅ Si connecté
  return <div>{children}</div>;
}
