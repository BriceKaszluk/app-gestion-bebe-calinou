import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import type { BabyDoc, InviteStatus } from "@/lib/babies";
import { normalizeEmail } from "@/lib/babies";
import { babyDocToDto } from "@/lib/babies/dto";

export const runtime = "nodejs";

const oid = (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error("Invalid ObjectId");
  return new ObjectId(id);
};

const TYPESAFE_OK = { ok: true } as const;

const querySchema = z.object({
  babyId: z.string().trim().min(1),
});

const inviteSchema = z.object({
  babyId: z.string().trim().min(1),
  email: z.string().trim().email(),
});

/** ✅ GET: liste les invitations d’un bébé (créateur = toutes, sinon seulement la sienne) */
export async function GET(req: Request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email?.toLowerCase() ?? null;
    if (!userEmail) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!parsed.success || !ObjectId.isValid(parsed.data.babyId)) {
      return NextResponse.json({ error: "babyId invalide" }, { status: 400 });
    }
    const babyId = parsed.data.babyId;

    const client = await clientPromise;
    const db = client.db("calinou");
    const babies = db.collection<BabyDoc>("babies");

    const baby = await babies.findOne(
      { _id: oid(babyId) },
      { projection: { _id: 1, parents: 1, invites: 1 } }
    );
    if (!baby) return NextResponse.json({ error: "Bébé introuvable" }, { status: 404 });

    const isMember = baby.parents.some((p) => p.email.toLowerCase() === userEmail);
    if (!isMember) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const creator = baby.parents[0]?.email?.toLowerCase() ?? "";
    const invites = (baby.invites ?? []).filter((i) => i.status !== "revoked");

    const visibleInvites =
      userEmail === creator ? invites : invites.filter((i) => i.email.toLowerCase() === userEmail);

    return NextResponse.json({
      ok: true,
      invites: babyDocToDto({ ...baby, invites: visibleInvites }).invites ?? [],
    });
  } catch (e) {
    console.error("GET /babies/invite error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** ✅ POST: invite un email (idempotent). Si l’utilisateur existe déjà → ajout direct comme parent. */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const requester = session?.user?.email?.toLowerCase() ?? null;
    if (!requester) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success || !ObjectId.isValid(parsed.data.babyId)) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const babyId = parsed.data.babyId;
    const target = normalizeEmail(parsed.data.email);

    const client = await clientPromise;
    const db = client.db("calinou");
    const babies = db.collection<BabyDoc>("babies");

    const baby = await babies.findOne(
      { _id: oid(babyId) },
      { projection: { _id: 1, parents: 1, invites: 1 } }
    );
    if (!baby) return NextResponse.json({ error: "Bébé introuvable" }, { status: 404 });

    const isMember = baby.parents.some((p) => p.email.toLowerCase() === requester);
    if (!isMember) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const creator = baby.parents[0]?.email?.toLowerCase() ?? "";
    if (requester !== creator) {
      return NextResponse.json({ error: "Seul le créateur peut inviter" }, { status: 403 });
    }

    // Déjà parent ?
    if (baby.parents.some((p) => p.email.toLowerCase() === target)) {
      return NextResponse.json({ ...TYPESAFE_OK, status: "already_parent" as const });
    }

    // Déjà invité (non révoqué) ?
    const existing = (baby.invites ?? []).find(
      (i) => i.email.toLowerCase() === target && i.status !== "revoked"
    );
    if (existing) {
      const status = existing.status === "pending" ? "already_pending" : "already_accepted";
      return NextResponse.json({ ...TYPESAFE_OK, status });
    }

    // L’utilisateur existe-t-il déjà ? Si oui → ajout direct comme parent
    const users = db.collection<{ email: string }>("users");
    const existingUser = await users.findOne({ email: target });
    if (existingUser) {
      await babies.updateOne(
        { _id: baby._id },
        {
          $addToSet: { parents: { email: target } },
          $pull: { invites: { email: target } },
        }
      );
      return NextResponse.json({ ...TYPESAFE_OK, status: "added_directly" as const });
    }

    // Sinon → on crée une invitation pending
    await babies.updateOne(
      { _id: baby._id },
      {
        $push: {
          invites: {
            email: target,
            invitedBy: requester,
            invitedAt: new Date(),
            status: "pending" as InviteStatus,
          },
        },
      },
    );

    return NextResponse.json({ ...TYPESAFE_OK, status: "created" as const });
  } catch (e) {
    console.error("POST /babies/invite error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** ✅ DELETE: révoque une invitation (ne supprime pas un parent) */
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const requester = session?.user?.email?.toLowerCase() ?? null;
    if (!requester) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success || !ObjectId.isValid(parsed.data.babyId)) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const { babyId, email } = parsed.data;
    const target = normalizeEmail(email);

    const client = await clientPromise;
    const db = client.db("calinou");
    const babies = db.collection<BabyDoc>("babies");

    const baby = await babies.findOne(
      { _id: oid(babyId) },
      { projection: { _id: 1, parents: 1, invites: 1 } }
    );
    if (!baby) return NextResponse.json({ error: "Bébé introuvable" }, { status: 404 });

    const creator = baby.parents[0]?.email?.toLowerCase() ?? "";
    const isMember = baby.parents.some((p) => p.email.toLowerCase() === requester);
    if (!isMember) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    if (requester !== creator && requester !== target) {
      // Seul le créateur ou l’invité lui-même peut révoquer l’invite
      return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    }

    await babies.updateOne(
      { _id: baby._id },
      { $set: { "invites.$[elem].status": "revoked" as InviteStatus } },
      { arrayFilters: [{ "elem.email": target }] }
    );

    return NextResponse.json({ ...TYPESAFE_OK, status: "revoked" as const });
  } catch (e) {
    console.error("DELETE /babies/invite error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
