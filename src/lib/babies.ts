// src/lib/babies.ts (server-only)
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

// Types minimaux
export type Parent = { email: string };
export type BabyDoc = {
  _id: ObjectId;
  name: string;
  parents: Parent[];
  invites?: Array<{
    email: string;
    invitedBy: string;
    invitedAt: Date;
    status: "pending" | "accepted" | "revoked";
  }>;
};

async function getDb() {
  const client = await clientPromise;
  return client.db("calinou");
}

// Renvoie le bébé si l'utilisateur en est parent, sinon null
export async function getBabyIfMember(email: string, babyId: string) {
  if (!ObjectId.isValid(babyId)) return null;

  const db = await getDb();
  const baby = await db
    .collection<BabyDoc>("babies")
    .findOne(
      { _id: new ObjectId(babyId), "parents.email": email },
      { projection: { _id: 1, name: 1, parents: 1 } } // projection stricte
    );

  return baby;
}

// Vérif booléenne simple (conserve l'API existante)
export async function verifyBabyAccess(email: string, babyId: string) {
  return (await getBabyIfMember(email, babyId)) !== null;
}

// Règle actuelle: 1er parent = créateur (à remplacer par createdBy si tu l'ajoutes)
export function isBabyCreator(baby: Pick<BabyDoc, "parents">, email: string) {
  return baby.parents[0]?.email === email;
}
