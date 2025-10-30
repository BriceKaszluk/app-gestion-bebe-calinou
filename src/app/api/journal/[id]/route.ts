import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";

// ❤️ PATCH → bascule favorite / unfavorite
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ correction : params est une Promise
) {
  const { id } = await params; // ✅ on attend la résolution

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("calinou");

  const existing = await db.collection("journal").findOne({ _id: new ObjectId(id) });
  if (!existing) {
    return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });
  }

  const updated = await db.collection("journal").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { favorite: !existing.favorite } },
    { returnDocument: "after" }
  );

  if (!updated?.value) {
    return NextResponse.json({ error: "Échec de la mise à jour" }, { status: 500 });
  }

  return NextResponse.json(updated.value);
}

// 🗑️ DELETE → suppression d'une entrée
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ même correction ici
) {
  const { id } = await params; // ✅ on attend la promesse

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("calinou");

  const result = await db.collection("journal").deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });
  }

  return NextResponse.json({ message: "Entrée supprimée" });
}
