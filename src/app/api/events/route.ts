import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import { verifyBabyAccess } from "@/lib/babies";
import { EVENT_TYPES, EventType } from "@/lib/timers/schema";

export const runtime = "nodejs";

type EventDoc = {
  _id: ObjectId;
  userEmail: string;
  babyId: ObjectId;
  type: EventType;
  startedAt: Date;
  endedAt?: Date;
  createdAt?: Date;
};

function oid(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  return new ObjectId(id);
}

// -------------------- POST --------------------
export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = (await req.json()) as
      | { type: EventType; babyId: string; startedAt?: string }
      | { type: "dodo"; babyId: string; endedAt: string };

    const { type, babyId } = body as { type: EventType; babyId: string };

    if (!type || !babyId || !EVENT_TYPES.includes(type)) {
      return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
    }

    if (!(await verifyBabyAccess(email, babyId))) {
      return NextResponse.json(
        { error: "Accès refusé à ce bébé" },
        { status: 403 },
      );
    }

    const client = await clientPromise;
    const db = client.db("calinou");
    const col = db.collection<EventDoc>("events");

    const toDate = (iso?: string): Date => {
      const d = iso ? new Date(iso) : new Date();
      return Number.isNaN(d.getTime()) ? new Date() : d;
    };

    // STOP dodo
    if (type === "dodo" && "endedAt" in body && body.endedAt) {
      const endedDate = toDate(body.endedAt);

      const { matchedCount } = await col.updateOne(
        { babyId: oid(babyId), type, endedAt: { $exists: false } },
        { $set: { endedAt: endedDate } },
      );

      if (matchedCount === 0) {
        await col.insertOne({
          _id: new ObjectId(),
          userEmail: email,
          babyId: oid(babyId),
          type,
          startedAt: endedDate,
          endedAt: endedDate,
          createdAt: new Date(),
        });
      }

      return NextResponse.json({ success: true, message: "Dodo clôturé" });
    }

    // START dodo ou clic non-dodo
    const startedDate =
      "startedAt" in body ? toDate(body.startedAt) : new Date();

    await col.insertOne({
      _id: new ObjectId(),
      userEmail: email,
      babyId: oid(babyId),
      type,
      startedAt: startedDate,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Événement enregistré",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// -------------------- GET --------------------
// ?type=...&babyId=...  -> { last?: { type, startedAt, endedAt? } }
export async function GET(req: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as EventType | null;
    const babyId = searchParams.get("babyId");

    if (!type || !babyId || !EVENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 },
      );
    }

    if (!(await verifyBabyAccess(email, babyId))) {
      return NextResponse.json(
        { error: "Accès refusé à ce bébé" },
        { status: 403 },
      );
    }

    const client = await clientPromise;
    const db = client.db("calinou");
    const col = db.collection<EventDoc>("events");

    let last: EventDoc | null = null;

    if (type === "dodo") {
      // Dodo en cours sinon dernier terminé
      last =
        (await col.findOne(
          { babyId: oid(babyId), type, endedAt: { $exists: false } },
          {
            sort: { startedAt: -1 },
            projection: { type: 1, startedAt: 1, endedAt: 1 },
          },
        )) ??
        (await col.findOne(
          { babyId: oid(babyId), type, endedAt: { $exists: true } },
          {
            sort: { endedAt: -1 },
            projection: { type: 1, startedAt: 1, endedAt: 1 },
          },
        ));
    } else {
      // Dernier event
      last = await col.findOne(
        { babyId: oid(babyId), type },
        {
          sort: { startedAt: -1 },
          projection: { type: 1, startedAt: 1, endedAt: 1 },
        },
      );
    }

    if (!last) return NextResponse.json({}); // pas de last

    return NextResponse.json({
      last: {
        type: last.type,
        startedAt: last.startedAt.toISOString(),
        endedAt: last.endedAt ? last.endedAt.toISOString() : undefined,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
