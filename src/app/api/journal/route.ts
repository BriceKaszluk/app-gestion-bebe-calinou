import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { JournalEntrySchema } from "@/lib/validation";
import { verifyBabyAccess } from "@/lib/babies";
import { insertJournalEntry, findJournalEntries } from "@/lib/journal";
import { z } from "zod";

export const runtime = "nodejs";

const querySchema = z.object({
  babyId: z.string().min(1),
  filter: z.enum(["all", "today", "week", "important"]).default("all"),
});

// 🧾 GET — Récupérer les entrées
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const { babyId, filter } = parsed.data;

  const access = await verifyBabyAccess(session.user.email, babyId);
  if (!access)
    return NextResponse.json({ error: "Accès refusé à ce profil bébé" }, { status: 403 });

  const entries = await findJournalEntries(babyId, filter);
  return NextResponse.json(entries);
}

// 📝 POST — Ajouter une note
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const json = await req.json();
  const parsed = JournalEntrySchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { babyId, message } = parsed.data;
  const access = await verifyBabyAccess(session.user.email, babyId);
  if (!access)
    return NextResponse.json({ error: "Accès refusé à ce profil bébé" }, { status: 403 });

  const entry = await insertJournalEntry({
    userEmail: session.user.email,
    babyId,
    message,
  });

  return NextResponse.json(entry, { status: 201 });
}
