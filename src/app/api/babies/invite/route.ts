import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

export const runtime = "nodejs";

type InviteStatus = "pending" | "accepted" | "revoked";
type Parent = { email: string };
type Invite = {
  email: string;
  invitedBy: string;
  invitedAt: Date;
  status: InviteStatus;
};
type BabyDoc = {
  _id: ObjectId;
  name: string;
  createdAt: Date;
  parents: Parent[];
  invites?: Invite[];
};

const TYPESAFE_OK = { ok: true } as const;

const oid = (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error("Invalid ObjectId");
  return new ObjectId(id);
};
const normEmail = (v: string) => v.trim().toLowerCase();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** ✅ GET: liste les invitations d’un bébé (créateur = toutes, sinon seulement la sienne) */
export async function GET(req: Request) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email?.toLowerCase() ?? null;
    if (!userEmail) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const babyId = searchParams.get("babyId");
    if (!babyId || !ObjectId.isValid(babyId)) {
      return NextResponse.json({ error: "babyId invalide" }, { status: 400 });
    }

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

    // Sérialisation minimale
    return NextResponse.json({
      ok: true,
      invites: visibleInvites.map((i) => ({
        email: i.email,
        invitedBy: i.invitedBy,
        invitedAt: i.invitedAt.toISOString?.() ?? new Date(i.invitedAt).toISOString(),
        status: i.status,
      })),
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

    const body = (await req.json()) as { babyId?: string; email?: string };
    const babyId = body.babyId?.trim();
    const target = body.email ? normEmail(body.email) : "";

    if (!babyId || !ObjectId.isValid(babyId)) {
      return NextResponse.json({ error: "babyId invalide" }, { status: 400 });
    }
    if (!target || !isEmail(target)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

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
    const invite: Invite = {
      email: target,
      invitedBy: requester,
      invitedAt: new Date(),
      status: "pending",
    };
    await babies.updateOne({ _id: baby._id }, { $push: { invites: invite } });

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

    const body = (await req.json()) as { babyId?: string; email?: string };
    const babyId = body.babyId?.trim();
    const target = body.email ? normEmail(body.email) : "";

    if (!babyId || !ObjectId.isValid(babyId)) {
      return NextResponse.json({ error: "babyId invalide" }, { status: 400 });
    }
    if (!target || !isEmail(target)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

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
