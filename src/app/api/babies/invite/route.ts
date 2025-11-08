import { NextResponse } from "next/server";
import { ObjectId, UpdateFilter } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

export const runtime = "nodejs";

type Parent = { email: string };
type Invite = {
  email: string;
  invitedBy: string;
  invitedAt: Date;
  status: "pending" | "accepted" | "revoked";
};

type BabyDoc = {
  _id: ObjectId;
  name: string;
  createdAt: Date;
  parents: Parent[];
  invites?: Invite[];
};

/** GET: liste les bébés du parent connecté */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const client = await clientPromise;
  const db = client.db("calinou");

  const babies = await db
    .collection<BabyDoc>("babies")
    .find({ "parents.email": session.user.email })
    .sort({ createdAt: 1 })
    .toArray();

  return NextResponse.json(babies);
}

/** POST: invite un parent (ajout direct si déjà inscrit) */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { babyId, email } = await req.json();
    if (!babyId || !email)
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("calinou");

    // Vérifie que le parent actuel est bien lié à ce bébé
    const baby = await db.collection<BabyDoc>("babies").findOne({
      _id: new ObjectId(babyId),
      "parents.email": session.user.email,
    });

    if (!baby) {
      return NextResponse.json(
        { error: "Bébé introuvable ou accès refusé" },
        { status: 403 }
      );
    }

    // 🧩 Vérifie si la personne est déjà parent de CE bébé
    const alreadyParent = (baby.parents ?? []).some(
      (p: Parent) => p.email === email
    );
    if (alreadyParent) {
      return NextResponse.json(
        { error: "Ce parent est déjà ajouté à ce bébé" },
        { status: 409 }
      );
    }

    // 📨 Vérifie si une invitation existe déjà pour CE bébé uniquement
    const alreadyInvited = (baby.invites ?? []).some(
      (i: Invite) => i.email === email && i.status === "pending"
    );
    if (alreadyInvited) {
      return NextResponse.json(
        { error: "Invitation déjà envoyée pour ce bébé" },
        { status: 409 }
      );
    }

    // 🔍 L'utilisateur invité s'est-il déjà connecté à Calinou ?
    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      // ✅ Ajout direct s’il est déjà inscrit
      const addParent: UpdateFilter<BabyDoc> = {
        $addToSet: { parents: { email } },
        $pull: { invites: { email } }, // Nettoie une éventuelle ancienne invitation
      };
      await db
        .collection<BabyDoc>("babies")
        .updateOne({ _id: new ObjectId(babyId) }, addParent);

      return NextResponse.json({
        message: "Parent ajouté directement (déjà inscrit)",
      });
    }

    // 🕓 Sinon, création d’une invitation différée
    const invite: Invite = {
      email,
      invitedBy: session.user.email,
      invitedAt: new Date(),
      status: "pending",
    };

    const pushInvite: UpdateFilter<BabyDoc> = {
      $push: { invites: invite },
    };

    await db
      .collection<BabyDoc>("babies")
      .updateOne({ _id: new ObjectId(babyId) }, pushInvite);

    return NextResponse.json({ message: "Invitation envoyée avec succès" });
  } catch (error) {
    console.error("Erreur ajout/invitation parent:", error);
    return NextResponse.json(
      { error: "Erreur lors de l’ajout ou de l’invitation du parent" },
      { status: 500 }
    );
  }
}

/** DELETE: supprime un parent du profil bébé */
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { babyId, email } = await req.json();
    if (!babyId || !email)
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("calinou");

    const baby = await db.collection<BabyDoc>("babies").findOne({
      _id: new ObjectId(babyId),
      "parents.email": session.user.email,
    });

    if (!baby)
      return NextResponse.json(
        { error: "Bébé introuvable ou accès refusé" },
        { status: 403 }
      );

    // 🚫 Empêche la suppression du dernier parent
    if (baby.parents.length <= 1)
      return NextResponse.json(
        { error: "Impossible de supprimer le dernier parent" },
        { status: 400 }
      );

    // ✅ Supprime proprement le parent ciblé
    const pullParent: UpdateFilter<BabyDoc> = {
      $pull: { parents: { email } },
    };

    await db
      .collection<BabyDoc>("babies")
      .updateOne({ _id: new ObjectId(babyId) }, pullParent);

    return NextResponse.json({ message: "Parent supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
