import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name } = await req.json();
  if (!name || !name.trim())
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const client = await clientPromise;
  const db = client.db("calinou");

  const newBaby = {
    name: name.trim(),
    createdAt: new Date(),
    parents: [{ email: session.user.email }],
  };

  const result = await db.collection("babies").insertOne(newBaby);

  return NextResponse.json({ ...newBaby, _id: result.insertedId });
}
