import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";
import { verifyBabyAccess } from "@/lib/babies";
import { z } from "zod";
import { EVENT_TYPES, type EventType } from "@/lib/timers/schema";

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

const NON_DODO_TYPES = EVENT_TYPES.filter(
  (t) => t !== "dodo",
) as [EventType, ...EventType[]];

const postSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("dodo"),
    babyId: z.string().min(1),
    endedAt: z.string().datetime().optional(),
    startedAt: z.string().datetime().optional(),
  }),
  z.object({
    type: z.enum(NON_DODO_TYPES),
    babyId: z.string().min(1),
    startedAt: z.string().datetime().optional(),
  }),
]);

const getSchema = z.object({
  type: z.enum(EVENT_TYPES),
  babyId: z.string().min(1),
});

const defaultError = { error: "Erreur serveur" } as const;

// -------------------- POST --------------------
export async function POST(req: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = postSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
    }

    const body = parsed.data;
    const { type, babyId } = body;

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
    if (type === "dodo" && body.endedAt) {
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
    const startedDate = toDate(body.startedAt);

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
    return NextResponse.json(defaultError, { status: 500 });
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
    const parsed = getSchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 },
      );
    }

    const { type, babyId } = parsed.data;

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
    return NextResponse.json(defaultError, { status: 500 });
  }
}
