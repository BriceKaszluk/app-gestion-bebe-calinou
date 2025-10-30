import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";


// ❤️ PATCH → bascule favorite / unfavorite
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("calinou");
  const id = params.id;

  const existing = await db
    .collection("journal")
    .findOne({ _id: new ObjectId(id) });

  if (!existing) {
    return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });
  }

  const updated = await db
    .collection("journal")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { favorite: !existing.favorite } },
      { returnDocument: "after" }
    );

  return NextResponse.json(updated.value);
}

// ❌ Optionnel : suppression
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("calinou");
  const id = params.id;

  await db.collection("journal").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ message: "Entrée supprimée" });
}
