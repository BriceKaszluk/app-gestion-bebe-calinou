import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { z } from "zod";

export const runtime = "nodejs"; // requis pour MongoDB sur Vercel

// --- Validation avec Zod
const EventSchema = z.object({
  type: z.string(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
});

// ➤ POST /api/events → crée un événement
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const json = await req.json();
  const body = EventSchema.parse(json);

  const client = await clientPromise;
  const db = client.db("calinou");

  await db.collection("events").insertOne({
    userEmail: session.user.email,
    type: body.type,
    startedAt: new Date(body.startedAt),
    endedAt: body.endedAt ? new Date(body.endedAt) : null,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

// ➤ GET /api/events?type=biberon → renvoie le dernier événement
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  if (!type) {
    return NextResponse.json({ error: "Type manquant" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("calinou");

  const lastEvent = await db
    .collection("events")
    .findOne(
      { userEmail: session.user.email, type },
      { sort: { startedAt: -1 } }
    );

  return NextResponse.json({ last: lastEvent || null });
}
