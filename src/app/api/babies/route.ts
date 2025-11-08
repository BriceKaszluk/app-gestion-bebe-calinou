import { NextResponse } from "next/server";
import { ObjectId, UpdateFilter } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

export const runtime = "nodejs"; // ✅ requis sur Vercel pour MongoDB

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
      .collection<BabyDoc>("babies")
      .findOne({ "parents.email": session.user.email });

    if (existing) {
      return NextResponse.json(
        { error: "Un profil bébé existe déjà pour ce parent" },
        { status: 409 }
      );
    }

    // 🧾 Création du bébé
  const result = await db
    .collection<Omit<BabyDoc, "_id">>("babies")
    .insertOne({
      name,
      createdAt: new Date(),
      parents: [{ email: session.user.email }],
      invites: [],
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

// 📋 Lister les bébés liés au parent connecté + gérer auto-acceptation des invitations
// 📋 Lister les bébés liés au parent connecté + gérer auto-acceptation des invitations
export async function GET() {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("calinou");

    // 🔍 Accepte automatiquement les invitations en attente
    const pendingInvites = await db
      .collection<BabyDoc>("babies")
      .find({ "invites.email": userEmail, "invites.status": "pending" })
      .toArray();

    for (const baby of pendingInvites) {
      await db.collection<BabyDoc>("babies").updateOne(
        { _id: baby._id },
        {
          $addToSet: { parents: { email: userEmail } },
          $set: { "invites.$[elem].status": "accepted" },
        },
        { arrayFilters: [{ "elem.email": userEmail }] }
      );
    }

    // ✅ Récupère TOUTES les correspondances : bébés créés + bébés invités
    const babies = await db
      .collection<BabyDoc>("babies")
      .find({
        $or: [
          { "parents.email": userEmail },
          { "invites.email": userEmail },
        ],
      })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json(babies);
  } catch (error) {
    console.error("Erreur récupération bébés:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

