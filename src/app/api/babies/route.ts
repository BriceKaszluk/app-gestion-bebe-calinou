import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

export const runtime = "nodejs"; // ✅ requis sur Vercel pour MongoDB

// 🍼 Créer un profil bébé
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Nom du bébé requis" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calinou");

    // ⚠️ Vérifie si ce parent a déjà un profil bébé
    const existing = await db
      .collection("babies")
      .findOne({ "parents.email": session.user.email });

    if (existing) {
      return NextResponse.json(
        { error: "Un profil bébé existe déjà pour ce parent" },
        { status: 409 }
      );
    }

    // 🧾 Création du bébé
    const result = await db.collection("babies").insertOne({
      name,
      createdAt: new Date(),
      parents: [{ email: session.user.email }],
    });

    return NextResponse.json({
      message: "Profil bébé créé avec succès",
      babyId: result.insertedId,
    });
  } catch (error) {
    console.error("Erreur création bébé:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du profil bébé" },
      { status: 500 }
    );
  }
}

// 📋 Lister les bébés liés au parent connecté
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("calinou");

    const babies = await db
      .collection("babies")
      .find({ "parents.email": session.user.email })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json(babies);
  } catch (error) {
    console.error("Erreur récupération bébés:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
