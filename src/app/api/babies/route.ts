import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
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

// 🍼 Création d’un profil bébé
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { name } = await req.json();
    if (!name || typeof name !== "string")
      return NextResponse.json({ error: "Nom du bébé requis" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("calinou");

    const existing = await db
      .collection<BabyDoc>("babies")
      .findOne({ "parents.email": session.user.email });

    if (existing) {
      return NextResponse.json(
        { error: "Un profil bébé existe déjà pour ce parent" },
        { status: 409 }
      );
    }

    const result = await db.collection<Omit<BabyDoc, "_id">>("babies").insertOne({
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

// 📋 Lister les bébés liés au parent connecté + auto-acceptation des invitations
export async function GET() {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("calinou");

    // 🔄 Accepte automatiquement les invitations "pending"
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

    // ✅ Étape clé : ne récupérer que les bébés accessibles
    // On exclut :
    //  - ceux dont l’utilisateur n’est plus parent
    //  - ceux dont son invitation est "revoked"
    const babies = await db
      .collection<BabyDoc>("babies")
      .aggregate([
        {
          $match: {
            $or: [
              { "parents.email": userEmail },
              {
                invites: {
                  $elemMatch: {
                    email: userEmail,
                    status: { $in: ["pending", "accepted"] },
                  },
                },
              },
            ],
          },
        },
        // 🚫 Exclure tout bébé où l’utilisateur est explicitement marqué "revoked"
        {
          $match: {
            $nor: [
              {
                invites: {
                  $elemMatch: {
                    email: userEmail,
                    status: "revoked",
                  },
                },
              },
            ],
          },
        },
        { $sort: { createdAt: 1 } },
      ])
      .toArray();

    return NextResponse.json(babies);
  } catch (error) {
    console.error("Erreur récupération bébés:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
