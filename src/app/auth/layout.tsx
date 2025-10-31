"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // ⏳ En cours de chargement
  if (status === "loading") {
    return <p>Chargement de la session...</p>;
  }

  // ❌ Si non connecté
  if (status === "unauthenticated" || !session) {
    redirect("/");
    return null; // on ne rend rien après redirection
  }

  // ✅ Si connecté
  return (
    <section className="p-4">
      <main>{children}</main>
    </section>
  );
}
