import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import { z } from "zod";
import type { BabyDoc } from "@/lib/babies";
import { babyDocToDto } from "@/lib/babies/dto";

export const runtime = "nodejs";

const babyInputSchema = z.object({
  name: z.string().trim().min(1, "Nom du bébé requis"),
});

const defaultError = { error: "Erreur serveur" } as const;

// 🍼 Création d’un profil bébé
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const json = await req.json();
    const parsed = babyInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Nom du bébé requis" }, { status: 400 });
    }

    const { name } = parsed.data;
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

    const newBaby: Omit<BabyDoc, "_id"> = {
      name,
      createdAt: new Date(),
      parents: [{ email: session.user.email }],
      invites: [],
    };

    const result = await db.collection<Omit<BabyDoc, "_id">>("babies").insertOne(newBaby);

    return NextResponse.json({
      message: "Profil bébé créé avec succès",
      babyId: result.insertedId.toHexString(),
    });
  } catch (error) {
    console.error("Erreur création bébé:", error);
    return NextResponse.json(defaultError, { status: 500 });
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

    // 👇 ICI : typer l’aggregate
    const babies = await db
      .collection<BabyDoc>("babies")
      .aggregate<BabyDoc>([
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

    const payload = babies.map(babyDocToDto);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Erreur récupération bébés:", error);
    return NextResponse.json(defaultError, { status: 500 });
  }
}
