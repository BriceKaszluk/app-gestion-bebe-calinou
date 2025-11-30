import { NextResponse } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { z } from "zod";
import type { BabyDoc } from "@/lib/babies";
import { babyDocToDto } from "@/lib/babies/dto";

export const runtime = "nodejs";

const babyInputSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const json = await req.json();
  const parsed = babyInputSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const { name } = parsed.data;
  const client = await clientPromise;
  const db = client.db("calinou");

  const newBaby: Omit<BabyDoc, "_id"> = {
    name,
    createdAt: new Date(),
    parents: [{ email: session.user.email }],
  };

  const result = await db.collection("babies").insertOne(newBaby);

  return NextResponse.json(babyDocToDto({ ...newBaby, _id: result.insertedId }));
}
