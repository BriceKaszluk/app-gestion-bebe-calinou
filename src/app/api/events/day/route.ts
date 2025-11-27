// src/app/api/events/day/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { verifyBabyAccess } from "@/lib/babies";
import {
  EVENT_TYPES,
  EventType,
  dayEventsResponseSchema,
} from "@/lib/timers/schema";

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

const querySchema = z.object({
  babyId: z.string().min(1),
  date: z.string().optional(), // "YYYY-MM-DD"
  type: z.enum(EVENT_TYPES).optional(),
});

function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(req: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides" },
      { status: 400 },
    );
  }

  const { babyId, date, type } = parsed.data;

  if (!(await verifyBabyAccess(email, babyId))) {
    return NextResponse.json(
      { error: "Accès refusé à ce bébé" },
      { status: 403 },
    );
  }

  const target = date ? new Date(date) : new Date();
  if (Number.isNaN(target.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  target.setHours(0, 0, 0, 0);
  const start = target;
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  const client = await clientPromise;
  const db = client.db("calinou");
  const col = db.collection<EventDoc>("events");

  const query: Record<string, unknown> = {
    babyId: new ObjectId(babyId),
    startedAt: { $gte: start, $lt: end },
  };

  if (type) query.type = type;

  const docs = await col
    .find(query)
    .sort({ startedAt: 1 })
    .toArray();

  const payload = {
    date: formatDateYYYYMMDD(start),
    babyId,
    type: type ?? null,
    events: docs.map((doc) => ({
      id: doc._id.toHexString(),
      type: doc.type,
      startedAt: doc.startedAt.toISOString(),
      endedAt: doc.endedAt ? doc.endedAt.toISOString() : null,
    })),
  };

  const safe = dayEventsResponseSchema.parse(payload);

  return NextResponse.json(safe, { status: 200 });
}
