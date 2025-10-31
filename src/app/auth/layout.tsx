"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();

  // ⏳ Pendant le chargement
  if (status === "loading") {
    return <p>Chargement de la session...</p>;
  }

  // ❌ Si l'utilisateur n'est pas connecté
  if (status === "unauthenticated" || !session) {
    redirect("/"); // ou return <p>Non autorisé</p>
  }

  return (
    <section className="p-4">
      <main>{children}</main>
    </section>
  )
}
