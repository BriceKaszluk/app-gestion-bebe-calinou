import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth"; // ✅ le bon import

// ✅ Récupérer toutes les entrées (avec filtres facultatifs)
export async function GET(req: Request) {
  const client = await clientPromise;
  const db = client.db("calinou");
  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "all";

  const now = new Date();
  let query: Record<string, unknown> = {};

  if (filter === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    query = { createdAt: { $gte: start, $lte: end } };
  } else if (filter === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    query = { createdAt: { $gte: weekAgo } };
  }

  const entries = await db
    .collection("journal")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(entries);
}

// ✅ Ajouter une entrée
export async function POST(req: Request) {
  const session = await auth(); // ✅ la nouvelle méthode pour récupérer la session
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "Message requis" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("calinou");

  const newEntry = {
    userEmail: session.user.email,
    message,
    createdAt: new Date(),
    favorite: false,
  };

  const result = await db.collection("journal").insertOne(newEntry);

  return NextResponse.json(
    { ...newEntry, _id: result.insertedId },
    { status: 201 }
  );
}
