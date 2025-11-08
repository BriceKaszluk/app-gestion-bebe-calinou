import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { babyId, email } = await req.json();
  if (!babyId || !email)
    return NextResponse.json({ error: "babyId et email requis" }, { status: 400 });

  const client = await clientPromise;
  const db = client.db("calinou");

  // 🔒 Vérifie que l’utilisateur actuel est bien parent de ce bébé
  const baby = await db.collection("babies").findOne({
    _id: new ObjectId(babyId),
    "parents.email": session.user.email,
  });

  if (!baby) {
    return NextResponse.json(
      { error: "Accès refusé à ce bébé" },
      { status: 403 }
    );
  }

  // ✅ Supprime le parent ciblé
  await db.collection("babies").updateOne(
    { _id: new ObjectId(babyId) },
    { $pull: { parents: { email } } } as any // ✅ évite l’erreur TS
  );

  return NextResponse.json({ message: "Parent supprimé avec succès" });
}
