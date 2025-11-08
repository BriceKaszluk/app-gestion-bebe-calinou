import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { babyId: string } } // ✅ plus de Promise ici
) {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { babyId } = await params; // ✅ direct, plus besoin de await
    if (!babyId)
      return NextResponse.json({ error: "ID du bébé manquant" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("calinou");

    // 🔎 Vérifie que le parent connecté a accès à ce bébé
    const baby = await db.collection("babies").findOne({
      _id: new ObjectId(babyId),
      $or: [
        { "parents.email": session.user.email },
        {
          invites: {
            $elemMatch: {
              email: session.user.email,
              status: { $in: ["pending", "accepted"] },
            },
          },
        },
      ],
    });

    if (!baby) {
      return NextResponse.json(
        { error: "Accès refusé à ce bébé" },
        { status: 403 }
      );
    }

    return NextResponse.json(baby);
  } catch (error) {
    console.error("Erreur récupération bébé :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement du bébé" },
      { status: 500 }
    );
  }
}
