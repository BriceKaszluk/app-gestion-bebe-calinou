import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseServer } from "@/lib/supabase";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entryId = formData.get("entryId")?.toString();

    if (!file || !entryId) {
      return NextResponse.json(
        { error: "Fichier ou ID d’entrée manquant" },
        { status: 400 }
      );
    }

    // Nom unique du fichier (dans un dossier par utilisateur)
    const fileName = `${session.user.email}/${Date.now()}_${file.name}`;

    // Utilisation du client serveur (bypass RLS)
    const { error: uploadError } = await supabaseServer.storage
      .from("journal")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 });

    // Sauvegarde du chemin dans MongoDB
    const client = await clientPromise;
    const db = client.db("calinou");

    await db.collection("journal").updateOne(
      { _id: new ObjectId(entryId) },
      { $set: { imagePath: fileName } }
    );

    return NextResponse.json({ message: "Upload réussi", path: fileName });
  } catch (err) {
    console.error("Erreur upload:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
