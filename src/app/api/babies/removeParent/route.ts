import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

type BabyDoc = {
  _id: ObjectId;
  name: string;
  createdAt: Date;
  parents: { email: string }[];
  invites?: { email: string; invitedBy: string; invitedAt: Date; status: string }[];
};

export const runtime = "nodejs";

/**
 * Révoque l'accès d'un parent à un bébé :
 *  - vérifie les droits du parent actuel
 *  - empêche la suppression du dernier parent
 *  - retire le parent ciblé du tableau `parents`
 *  - marque son invitation comme `revoked` pour conserver l'historique
 */
export async function POST(req: Request) {
  try {
    // 🔐 Authentification du parent actuel
    const session = await auth();
    const requesterEmail = session?.user?.email;
    if (!requesterEmail)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // 📦 Lecture des paramètres
    const { babyId, email } = await req.json();
    if (!babyId || !email)
      return NextResponse.json(
        { error: "babyId et email requis" },
        { status: 400 }
      );

    // 🔗 Connexion à MongoDB
    const client = await clientPromise;
    const db = client.db("calinou");

    // 🔍 Vérifie que le demandeur est bien parent du bébé
    const baby = await db.collection("babies").findOne({
      _id: new ObjectId(babyId),
      "parents.email": requesterEmail,
    });

    if (!baby)
      return NextResponse.json(
        { error: "Accès refusé à ce bébé" },
        { status: 403 }
      );

    // 🛑 Empêche la suppression du dernier parent
    if ((baby.parents?.length || 0) <= 1) {
      return NextResponse.json(
        { error: "Impossible de supprimer le dernier parent" },
        { status: 400 }
      );
    }

    // 🧩 Supprime le parent et marque l'invitation comme révoquée
    await db.collection<BabyDoc>("babies").updateOne(
      { _id: new ObjectId(babyId) },
      {
        $pull: { parents: { email } },
        $set: { "invites.$[elem].status": "revoked" },
      },
      { arrayFilters: [{ "elem.email": email }] }
    );

    // ✅ Réponse de succès
    return NextResponse.json({
      message: "Accès du parent révoqué avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
