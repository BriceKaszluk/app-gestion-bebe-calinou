import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("calinou");

  const { id } = await context.params;
  const entry = await db
    .collection("journal")
    .findOne({ _id: new ObjectId(id), userEmail: session.user.email });

  if (!entry) {
    return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });
  }

  const updated = await db
    .collection("journal")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { favorite: !entry.favorite } },
      { returnDocument: "after" }
    );

  if (!updated) {
  return NextResponse.json(
    { error: "Aucune mise à jour effectuée" },
    { status: 500 }
  );
}

// ✅ Nettoyage avant envoi
const value = JSON.parse(JSON.stringify(updated));
return NextResponse.json(value);

}
