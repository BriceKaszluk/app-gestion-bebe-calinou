import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function insertJournalEntry(entry: {
  userEmail: string;
  babyId: string;
  message: string;
}) {
  const client = await clientPromise;
  const db = client.db("calinou");

  const newEntry = {
    userEmail: entry.userEmail,
    babyId: new ObjectId(entry.babyId),
    message: entry.message,
    createdAt: new Date(),
    favorite: false,
  };

  const result = await db.collection("journal").insertOne(newEntry);
  return { ...newEntry, _id: result.insertedId };
}

export async function findJournalEntries(
  email: string,
  babyId: string,
  filter: string
) {
  const client = await clientPromise;
  const db = client.db("calinou");

  const now = new Date();
  const query: Record<string, unknown> = {
    babyId: new ObjectId(babyId),
  };

  if (filter === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  } else if (filter === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    query.createdAt = { $gte: weekAgo };
  }

  return await db.collection("journal").find(query).sort({ createdAt: -1 }).toArray();
}
