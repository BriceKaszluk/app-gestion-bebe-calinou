// src/app/api/babies/removeParent/route.ts
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

export const runtime = "nodejs";

type Parent = { email: string };
type InviteStatus = "pending" | "accepted" | "revoked";
type Invite = { email: string; invitedBy: string; invitedAt: Date; status: InviteStatus };
type BabyDoc = {
  _id: ObjectId;
  name: string;
  createdAt: Date;
  parents: Parent[];
  invites?: Invite[];
};

const oid = (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error("Invalid ObjectId");
  return new ObjectId(id);
};

export async function POST(req: Request) {
  try {
    // Auth
    const session = await auth();
    const requesterEmail = session?.user?.email;
    if (!requesterEmail) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Body
    const { babyId, email } = (await req.json()) as { babyId?: string; email?: string };
    if (!babyId || !email) {
      return NextResponse.json({ error: "babyId et email requis" }, { status: 400 });
    }
    if (!ObjectId.isValid(babyId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calinou");

    // Récupère le bébé (projection stricte)
    const baby = await db
      .collection<BabyDoc>("babies")
      .findOne({ _id: oid(babyId) }, { projection: { _id: 1, parents: 1, invites: 1 } });

    if (!baby) {
      return NextResponse.json({ error: "Bébé introuvable" }, { status: 404 });
    }

    // Le demandeur doit être parent
    const isMember = baby.parents.some((p) => p.email === requesterEmail);
    if (!isMember) {
      return NextResponse.json({ error: "Accès refusé à ce bébé" }, { status: 403 });
    }

    // Seul le créateur peut révoquer
    const creatorEmail = baby.parents[0]?.email ?? null;
    const isCreator = creatorEmail === requesterEmail;
    if (!isCreator) {
      return NextResponse.json({ error: "Seul le créateur peut révoquer un parent" }, { status: 403 });
    }

    // On ne peut pas supprimer le créateur
    if (email === creatorEmail) {
      return NextResponse.json({ error: "Impossible de supprimer le créateur" }, { status: 400 });
    }

    // Le parent ciblé doit exister
    const targetExists = baby.parents.some((p) => p.email === email);
    if (!targetExists) {
      return NextResponse.json({ error: "Parent cible introuvable" }, { status: 404 });
    }

    // Empêche la suppression du dernier parent
    if (baby.parents.length <= 1) {
      return NextResponse.json({ error: "Impossible de supprimer le dernier parent" }, { status: 400 });
    }

    // Suppression + révocation d'invite éventuelle
    const res = await db.collection<BabyDoc>("babies").updateOne(
      { _id: oid(babyId) },
      {
        $pull: { parents: { email } },
        $set: { "invites.$[elem].status": "revoked" as InviteStatus },
      },
      { arrayFilters: [{ "elem.email": email }] }
    );

    if (res.modifiedCount === 0) {
      // Rien n'a été retiré → incohérence
      return NextResponse.json({ error: "Aucune modification effectuée" }, { status: 409 });
    }

    return NextResponse.json({ message: "Accès du parent révoqué avec succès" });
  } catch (error) {
    console.error("Erreur suppression parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
