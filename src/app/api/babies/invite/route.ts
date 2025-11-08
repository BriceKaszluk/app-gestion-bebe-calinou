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

/** GET: liste les bébés visibles par le parent connecté */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const client = await clientPromise;
  const db = client.db("calinou");

  // 💡 On affiche uniquement les bébés où l’utilisateur est parent
  //    ou possède une invitation encore valide (pending/accepted)
  const babies = await db
    .collection<BabyDoc>("babies")
    .find({
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
    })
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
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );

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

    const alreadyParent = (baby.parents ?? []).some(
      (p: Parent) => p.email === email
    );
    if (alreadyParent)
      return NextResponse.json(
        { error: "Ce parent est déjà ajouté à ce bébé" },
        { status: 409 }
      );

    const alreadyInvited = (baby.invites ?? []).some(
      (i: Invite) => i.email === email && i.status === "pending"
    );
    if (alreadyInvited)
      return NextResponse.json(
        { error: "Invitation déjà envoyée pour ce bébé" },
        { status: 409 }
      );

    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      const addParent: UpdateFilter<BabyDoc> = {
        $addToSet: { parents: { email } },
        $pull: { invites: { email } },
      };
      await db
        .collection<BabyDoc>("babies")
        .updateOne({ _id: new ObjectId(babyId) }, addParent);

      return NextResponse.json({
        message: "Parent ajouté directement (déjà inscrit)",
      });
    }

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

/** DELETE: révoque complètement un parent */
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { babyId, email } = await req.json();
    if (!babyId || !email)
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );

    const client = await clientPromise;
    const db = client.db("calinou");

    const baby = await db.collection<BabyDoc>("babies").findOne({
      _id: new ObjectId(babyId),
    });

    if (!baby)
      return NextResponse.json({ error: "Bébé introuvable" }, { status: 404 });

    const creatorEmail = baby.parents[0]?.email;
    if (creatorEmail !== session.user.email)
      return NextResponse.json(
        { error: "Seul le créateur peut révoquer un accès" },
        { status: 403 }
      );

    if (email === creatorEmail)
      return NextResponse.json(
        { error: "Impossible de révoquer le créateur" },
        { status: 400 }
      );

    // 💡 Supprime le parent et marque l’invitation comme révoquée si elle existe
    await db.collection("babies").updateOne(
      { _id: new ObjectId(babyId) },
      {
        $pull: { parents: { email } },
        $set: { "invites.$[elem].status": "revoked" },
      },
      { arrayFilters: [{ "elem.email": email }] }
    );

    return NextResponse.json({ message: "Accès révoqué avec succès" });
  } catch (error) {
    console.error("Erreur révocation parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
