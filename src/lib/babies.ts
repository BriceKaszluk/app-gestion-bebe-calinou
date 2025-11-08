import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function verifyBabyAccess(email: string, babyId: string) {
  const client = await clientPromise;
  const db = client.db("calinou");

  const baby = await db.collection("babies").findOne({
    _id: new ObjectId(babyId),
    "parents.email": email,
  });

  return !!baby;
}
