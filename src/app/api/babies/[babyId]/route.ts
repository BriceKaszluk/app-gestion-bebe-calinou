// src/app/api/babies/[babyId]/route.ts
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
  parents: Parent[];
  invites?: Invite[];
};

export async function GET(
  _req: Request,
  { params }: { params: { babyId: string } }
) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { babyId } = params; // ✅ pas d'await
    if (!babyId || !ObjectId.isValid(babyId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calinou");

    // Accès: parent OU invité (pending/accepted)
    const baby = await db
      .collection<BabyDoc>("babies")
      .findOne(
        {
          _id: new ObjectId(babyId),
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
        {
          projection: { _id: 1, name: 1, parents: 1, invites: 1 }, // projection stricte
        }
      );

    if (!baby) {
      return NextResponse.json(
        { error: "Accès refusé à ce bébé" },
        { status: 403 }
      );
    }

    const isCreator = baby.parents?.[0]?.email === userEmail;

    // Sanitize: seuls les créateurs voient toutes les invitations.
    // Les autres ne voient que leur propre invitation (utile pour afficher le statut).
    const invites =
      baby.invites && baby.invites.length > 0
        ? isCreator
          ? baby.invites
          : baby.invites.filter((i) => i.email === userEmail)
        : undefined;

    // Normalisation pour le front (évite l'ObjectId côté client)
    const payload = {
      _id: baby._id.toString(),
      name: baby.name,
      parents: baby.parents,
      ...(invites ? { invites } : {}),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Erreur récupération bébé :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement du bébé" },
      { status: 500 }
    );
  }
}
