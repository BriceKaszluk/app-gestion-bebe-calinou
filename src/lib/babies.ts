// src/lib/babies.ts (server-only)
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export type Parent = { email: string };

export type InviteStatus = "pending" | "accepted" | "revoked";
export type Invite = {
  email: string;
  invitedBy: string;
  invitedAt: Date;
  status: InviteStatus;
};

export type BabyDoc = {
  _id: ObjectId;
  name: string;
  parents: Parent[];
  invites?: Invite[];
  createdAt?: Date; // parfois présent dans tes routes
};

const norm = (s: string) => s.trim().toLowerCase();

async function getDb() {
  const client = await clientPromise;
  return client.db("calinou");
}

/**
 * Renvoie le bébé si l'utilisateur est PARENT (accès fort : écriture)
 * ⚠️ Hypothèse : emails stockés en lowercase (bonne pratique imposée dans les routes).
 */
export async function getBabyIfMember(email: string, babyId: string) {
  if (!ObjectId.isValid(babyId)) return null;
  const db = await getDb();
  return db
    .collection<BabyDoc>("babies")
    .findOne(
      { _id: new ObjectId(babyId), "parents.email": norm(email) },
      { projection: { _id: 1, name: 1, parents: 1 } }
    );
}

/** Vérif booléenne stricte parent */
export async function verifyBabyAccess(email: string, babyId: string) {
  return (await getBabyIfMember(email, babyId)) !== null;
}

/**
 * Visibilité "souple" : parent OU invité (pending/accepted).
 * À utiliser pour afficher la fiche bébé sans donner de droits d'édition.
 */
export async function verifyBabyVisibleTo(email: string, babyId: string) {
  if (!ObjectId.isValid(babyId)) return false;
  const db = await getDb();
  const baby = await db
    .collection<BabyDoc>("babies")
    .findOne(
      {
        _id: new ObjectId(babyId),
        $or: [
          { "parents.email": norm(email) },
          {
            invites: {
              $elemMatch: { email: norm(email), status: { $in: ["pending", "accepted"] } },
            },
          },
        ],
      },
      { projection: { _id: 1 } }
    );
  return !!baby;
}

/** Créateur = premier parent (règle actuelle) */
export function isBabyCreator(baby: Pick<BabyDoc, "parents">, email: string) {
  return baby.parents[0]?.email === norm(email);
}
