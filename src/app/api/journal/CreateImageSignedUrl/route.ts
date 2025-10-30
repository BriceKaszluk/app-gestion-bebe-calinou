import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseServer } from "@/lib/supabase"; // ⚠️ Utilise la clé SERVICE_ROLE_KEY

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // On récupère le chemin envoyé depuis le front
    const { path } = await req.json();
    if (!path) {
      return NextResponse.json(
        { error: "Chemin d’image manquant" },
        { status: 400 }
      );
    }

    // Génération de l’URL signée (valable 1h)
    const { data, error } = await supabaseServer
      .storage
      .from("journal")
      .createSignedUrl(path, 3600);

    if (error) {
      console.error("Erreur Supabase createSignedUrl:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ url: data?.signedUrl });
  } catch (err) {
    console.error("Erreur createSignedUrl:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
