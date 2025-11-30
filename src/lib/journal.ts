import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export type JournalFilter = "all" | "today" | "week" | "important";

type JournalEntryDoc = {
  _id: ObjectId;
  userEmail: string;
  babyId: ObjectId;
  message?: string;
  createdAt: Date;
  favorite?: boolean;
  imagePath?: string;
  signedUrl?: string;
};

export type JournalEntryDto = {
  _id: string;
  message?: string;
  createdAt: string;
  favorite?: boolean;
  imagePath?: string;
  signedUrl?: string;
};

type InsertJournalEntryInput = {
  userEmail: string;
  babyId: string;
  message: string;
};

function toDto(doc: JournalEntryDoc): JournalEntryDto {
  return {
    _id: doc._id.toHexString(),
    message: doc.message,
    createdAt: doc.createdAt.toISOString(),
    favorite: doc.favorite ?? false,
    imagePath: doc.imagePath,
    signedUrl: doc.signedUrl,
  };
}

export async function insertJournalEntry(
  entry: InsertJournalEntryInput,
): Promise<JournalEntryDto> {
  const client = await clientPromise;
  const db = client.db("calinou");

  const newEntry: JournalEntryDoc = {
    userEmail: entry.userEmail,
    babyId: new ObjectId(entry.babyId),
    message: entry.message,
    createdAt: new Date(),
    favorite: false,
  };

  const result = await db.collection<JournalEntryDoc>("journal").insertOne(newEntry);
  return toDto({ ...newEntry, _id: result.insertedId });
}

export async function findJournalEntries(
  babyId: string,
  filter: JournalFilter,
): Promise<JournalEntryDto[]> {
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
  } else if (filter === "important") {
    query.favorite = true;
  }

  const docs = await db
    .collection<JournalEntryDoc>("journal")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map(toDto);
}
