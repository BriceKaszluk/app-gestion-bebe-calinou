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

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // ✅ Récupérer babyId depuis l’URL (compatible Next 15, pas de 2e arg typé)
    const pathname = new URL(req.url).pathname; // ex: /api/babies/6719b7.../...
    const parts = pathname.split("/").filter(Boolean);
    const babiesIdx = parts.indexOf("babies");
    const babyId = babiesIdx >= 0 ? parts[babiesIdx + 1] : "";

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
        { projection: { _id: 1, name: 1, parents: 1, invites: 1 } }
      );

    if (!baby) {
      return NextResponse.json(
        { error: "Accès refusé à ce bébé" },
        { status: 403 }
      );
    }

    const isCreator = baby.parents?.[0]?.email === userEmail;

    // Masquer les invites pour les non-créateurs (sauf la leur)
    const invites =
      baby.invites && baby.invites.length > 0
        ? isCreator
          ? baby.invites
          : baby.invites.filter((i) => i.email === userEmail)
        : undefined;

    return NextResponse.json({
      _id: baby._id.toString(),
      name: baby.name,
      parents: baby.parents,
      ...(invites ? { invites } : {}),
    });
  } catch (error) {
    console.error("Erreur récupération bébé :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement du bébé" },
      { status: 500 }
    );
  }
}
