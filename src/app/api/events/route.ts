import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

export const runtime = "nodejs"; // requis pour MongoDB sur Vercel

// 🟢 Créer ou mettre à jour un événement (start/stop, etc.)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { type, startedAt, endedAt, babyId } = await req.json();

  if (!type || !babyId) {
    return NextResponse.json({ error: "type et babyId requis" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("calinou");

  // Vérifie que le parent a bien accès à ce bébé
  const baby = await db.collection("babies").findOne({
    _id: new ObjectId(babyId),
    "parents.email": session.user.email,
  });

  if (!baby) {
    return NextResponse.json({ error: "Accès refusé à ce bébé" }, { status: 403 });
  }

  // Création ou mise à jour de l'événement
  const newEvent = {
    userEmail: session.user.email,
    babyId: new ObjectId(babyId),
    type,
    startedAt: new Date(startedAt),
    ...(endedAt && { endedAt: new Date(endedAt) }),
    createdAt: new Date(),
  };

  await db.collection("events").insertOne(newEvent);
  return NextResponse.json({ success: true });
}

// 🟣 Récupérer le dernier événement d’un type donné
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const babyId = url.searchParams.get("babyId");

  if (!type || !babyId) {
    return NextResponse.json({ error: "type et babyId requis" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("calinou");

  const baby = await db.collection("babies").findOne({
    _id: new ObjectId(babyId),
    "parents.email": session.user.email,
  });

  if (!baby) {
    return NextResponse.json({ error: "Accès refusé à ce bébé" }, { status: 403 });
  }

  const lastEvent = await db
    .collection("events")
    .find({ babyId: new ObjectId(babyId), type })
    .sort({ startedAt: -1 })
    .limit(1)
    .toArray();

  return NextResponse.json({ last: lastEvent[0] || null });
}
