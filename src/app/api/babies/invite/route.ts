import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

export const runtime = "nodejs";

type Baby = {
  _id: ObjectId;
  name: string;
  parents: { email: string }[];
  createdAt: Date;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const client = await clientPromise;
  const db = client.db("calinou");

  const babies = await db
    .collection("babies")
    .find({ "parents.email": session.user.email })
    .sort({ createdAt: 1 })
    .toArray();

  return NextResponse.json(babies);
}

// ➕ Ajouter un parent au profil bébé
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { babyId, email } = await req.json();
    if (!babyId || !email) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calinou");

    // 🔐 Vérifie que le parent actuel est bien lié à ce bébé
    const baby = await db.collection("babies").findOne({
      _id: new ObjectId(babyId),
      "parents.email": session.user.email,
    });

    if (!baby) {
      return NextResponse.json(
        { error: "Bébé introuvable ou accès refusé" },
        { status: 403 }
      );
    }

    // ✅ Ajoute le parent invité
    await db.collection("babies").updateOne(
      { _id: new ObjectId(babyId) },
      { $addToSet: { parents: { email } } }
    );

    return NextResponse.json({ message: "Parent ajouté avec succès" });
  } catch (error) {
    console.error("Erreur ajout parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ➖ Supprimer un parent du profil bébé
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { babyId, email } = await req.json();
    if (!babyId || !email) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calinou");

    // 🔐 Vérifie que le parent actuel est bien lié à ce bébé
    const baby = await db.collection("babies").findOne({
      _id: new ObjectId(babyId),
      "parents.email": session.user.email,
    });

    if (!baby) {
      return NextResponse.json(
        { error: "Bébé introuvable ou accès refusé" },
        { status: 403 }
      );
    }

    // 🚫 Empêche la suppression du dernier parent
    if (baby.parents.length <= 1) {
      return NextResponse.json(
        { error: "Impossible de supprimer le dernier parent" },
        { status: 400 }
      );
    }

    // ✅ Supprime le parent ciblé
    await db.collection<Baby>("babies").updateOne(
      { _id: new ObjectId(babyId) },
      { $pull: { parents: { email } } }
    );

    return NextResponse.json({ message: "Parent supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
